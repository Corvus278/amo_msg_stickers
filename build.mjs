import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { glob, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import * as esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const isWatch = process.argv.includes('--watch');

/**
 * Адреса локального amo добавляются только в dev-сборку (`pnpm watch`): боевая работает
 * лишь на *.amo.tm.
 */
const DEV_MATCHES = ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'];
const devMatches = isWatch ? DEV_MATCHES : [];

/**
 * Файл userscript последнего релиза: `latest` — всегда наибольшая версия, и менеджер
 * находит по этому адресу каждое следующее обновление.
 */
const LATEST_USERSCRIPT_URL =
  'https://github.com/mcar2107/amo_msg_stickers/releases/latest/download/amo-stickers.user.js';

/**
 * Автообновление — только у боевой сборки: userscript из `pnpm watch` менеджер
 * заменил бы версией из релиза.
 */
const updateDirectives = isWatch
  ? []
  : [
      `// @updateURL    ${LATEST_USERSCRIPT_URL}`,
      `// @downloadURL  ${LATEST_USERSCRIPT_URL}`,
    ];

/**
 * Иконка userscript в менеджере — та же, что у расширения, встроенная data URI: адрес файла
 * в репозитории зависел бы от ветки и пути, а менеджер ходил бы за ним в сеть.
 */
const USERSCRIPT_ICON = `data:image/png;base64,${readFileSync('src/extension/icons/icon48.png').toString('base64')}`;

const USERSCRIPT_BANNER = [
  '// ==UserScript==',
  '// @name         amo stickers',
  /**
   * Описание без суффикса языка менеджер показывает по умолчанию, `:en` — браузеру на
   * английском; название одно на все языки.
   */
  '// @description  Стикеры и GIF в amo: GIPHY/KLIPY, импорт паков из Telegram, свои стикеры',
  '// @description:en Stickers and GIFs in amo: GIPHY/KLIPY, Telegram pack import, custom stickers',
  '// @version      0.14.2',
  `// @icon         ${USERSCRIPT_ICON}`,
  ...['https://*.amo.tm/*', ...devMatches].map((match) => {
    return `// @match        ${match}`;
  }),
  '// @grant        GM_xmlhttpRequest',
  '// @grant        GM_getValue',
  '// @grant        GM_setValue',
  /**
   * Хосты сетевой политики — те же, что `ALLOWED_HOSTS` и `ALLOWED_DOMAINS` в
   * `src/core/net.ts`; поддомены `@connect` пропускает сам.
   */
  '// @connect      api.telegram.org',
  '// @connect      giphy.com',
  '// @connect      klipy.com',
  /**
   * Изолированный мир (Tampermonkey — `@sandbox`, Violentmonkey — `@inject-into`):
   * скрипты страницы не видят ни код ядра, ни GM API, ни настройки.
   */
  '// @sandbox      DOM',
  '// @inject-into  content',
  '// @run-at       document-idle',
  ...updateDirectives,
  '// ==/UserScript==',
].join('\n');

/**
 * Обёртка кода userscript: `"use strict"` esbuild ставит в начало файла, а
 * Userscripts для Safari (4.x) исполняет код как тело
 * `Function('{GM_getValue,…}', code)` — с деструктуризацией в параметрах такой
 * директиве быть нельзя, и скрипт падает с SyntaxError. Внутри стрелочной
 * функции без параметров директива законна, и строгий режим ядра сохраняется.
 */
const USERSCRIPT_WRAP_START = '(() => {\n"use strict";';
const USERSCRIPT_WRAP_END = '})();';

const TAILWIND_CONFIG = 'tailwind.config.ts';

/**
 * Компоненты, по классам которых Tailwind собирает CSS пикера. Вместе с
 * `tailwind.config.ts` они идут в `watchFiles`: конфиг в бандл не входит, и без
 * явной подписки новый токен не пересобрал бы CSS в `watch`.
 */
const TAILWIND_WATCH_GLOB = 'src/core/ui/**/*.tsx';

/**
 * Последний загруженный конфиг и `mtime` его файла.
 */
const tailwindConfigCache = { mtimeMs: 0, config: undefined };

/**
 * ESM-модуль кэшируется по URL, поэтому свежий конфиг грузится с меткой `mtime` в
 * query — иначе `watch` собирал бы CSS по старым токенам. Метка меняется только с
 * файлом: каждый импорт по новому URL оставляет в памяти ещё один экземпляр модуля,
 * а новый объект конфига — лишняя работа Tailwind на каждой пересборке.
 */
const loadTailwindConfig = async () => {
  const { mtimeMs } = await stat(TAILWIND_CONFIG);

  if (mtimeMs !== tailwindConfigCache.mtimeMs) {
    const { tailwindConfig } = await import(`./${TAILWIND_CONFIG}?t=${mtimeMs}`);

    tailwindConfigCache.mtimeMs = mtimeMs;
    tailwindConfigCache.config = tailwindConfig;
  }

  return tailwindConfigCache.config;
};

/**
 * В `watch` CSS остаётся читаемым для отладки в DevTools, в сборке — минифицируется:
 * текст с loader `text` esbuild как CSS не разбирает и сам не сожмёт.
 */
const minifyCss = async (css) => {
  if (isWatch) {
    return css;
  }

  const { code } = await esbuild.transform(css, {
    loader: 'css',
    minify: true,
    target: 'chrome120',
  });

  return code;
};

/**
 * `picker.css` приходит в бандл строкой (loader `text`) — её вставляют `<style>` в
 * shadow root пикера.
 */
const tailwindPlugin = {
  name: 'tailwind',
  setup(build) {
    build.onLoad(
      { filter: /[/\\]src[/\\]core[/\\]ui[/\\]picker\.css$/ },
      async ({ path }) => {
        const source = await readFile(path, 'utf8');
        const config = await loadTailwindConfig();
        const { css } = await postcss([tailwindcss(config)]).process(source, {
          from: path,
        });
        const contents = await minifyCss(css);
        const components = await Array.fromAsync(glob(TAILWIND_WATCH_GLOB), (file) => {
          return resolve(file);
        });

        return {
          contents,
          loader: 'text',
          watchFiles: [path, resolve(TAILWIND_CONFIG), ...components],
        };
      }
    );
  },
};

const GIF_WORKER_MODULE = 'gif-worker:code';
const GIF_WORKER_NAMESPACE = 'gif-worker';
const GIF_WORKER_ENTRY = 'src/core/gifWorkerEntry.ts';

/**
 * Код Worker-а кодирования GIF приходит в ядро строкой из виртуального модуля
 * `gif-worker:code` (`GIF_WORKER_CODE`): ядро запускает Worker из blob URL, отдельный
 * файл Worker-а userscript подключить не может. Бандл Worker-а собирается отдельным
 * вызовом esbuild на каждую сборку, его входы идут в `watchFiles` — правка кодировщика
 * в `pnpm watch` пересобирает и код Worker-а внутри ядра.
 */
const gifWorkerPlugin = {
  name: 'gif-worker',
  setup(build) {
    build.onResolve({ filter: /^gif-worker:code$/ }, () => {
      return { path: GIF_WORKER_MODULE, namespace: GIF_WORKER_NAMESPACE };
    });

    build.onLoad({ filter: /.*/, namespace: GIF_WORKER_NAMESPACE }, async () => {
      const { outputFiles, metafile } = await esbuild.build({
        entryPoints: [GIF_WORKER_ENTRY],
        bundle: true,
        write: false,
        metafile: true,
        format: 'iife',
        target: 'chrome120',
        minify: !isWatch,
        sourcemap: isWatch ? 'inline' : false,
        legalComments: 'none',
      });
      const [output] = outputFiles;

      return {
        contents: `export const GIF_WORKER_CODE = ${JSON.stringify(output.text)};`,
        loader: 'js',
        watchFiles: Object.keys(metafile.inputs).map((file) => {
          return resolve(file);
        }),
      };
    });
  },
};

const common = {
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
  plugins: [tailwindPlugin, gifWorkerPlugin],
};

const configs = [
  {
    ...common,
    entryPoints: ['src/extension/content.ts'],
    outfile: 'dist/extension/content.js',
  },
  {
    ...common,
    entryPoints: ['src/extension/background.ts'],
    outfile: 'dist/extension/background.js',
  },
  {
    ...common,
    entryPoints: ['src/userscript/index.ts'],
    outfile: 'dist/amo-stickers.user.js',
    banner: { js: `${USERSCRIPT_BANNER}\n${USERSCRIPT_WRAP_START}` },
    footer: { js: USERSCRIPT_WRAP_END },
  },
];

mkdirSync('dist/extension', { recursive: true });
const manifest = JSON.parse(readFileSync('src/extension/manifest.json', 'utf8'));

for (const script of manifest.content_scripts) script.matches.push(...devMatches);
writeFileSync('dist/extension/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
/**
 * Переводы описания: manifest ссылается на них через `__MSG_extDescription__`, и без
 * каталога Chrome не загрузит расширение.
 */
cpSync('src/extension/_locales', 'dist/extension/_locales', { recursive: true });
/**
 * Иконки из `icons` manifest: без файла по пути Chrome не загрузит расширение.
 */
cpSync('src/extension/icons', 'dist/extension/icons', { recursive: true });

if (isWatch) {
  for (const config of configs) {
    const context = await esbuild.context(config);

    await context.watch();
  }
} else {
  await Promise.all(
    configs.map((config) => {
      return esbuild.build(config);
    })
  );
}
