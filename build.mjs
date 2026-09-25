import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const USERSCRIPT_BANNER = [
  '// ==UserScript==',
  '// @name         amo stickers',
  '// @version      0.5.0',
  ...['https://*.amo.tm/*', ...devMatches].map((match) => {
    return `// @match        ${match}`;
  }),
  '// @grant        none',
  '// @run-at       document-idle',
  '// ==/UserScript==',
].join('\n');

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
  plugins: [tailwindPlugin],
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
    banner: { js: USERSCRIPT_BANNER },
  },
];

mkdirSync('dist/extension', { recursive: true });
const manifest = JSON.parse(readFileSync('src/extension/manifest.json', 'utf8'));

for (const script of manifest.content_scripts) script.matches.push(...devMatches);
writeFileSync('dist/extension/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

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
