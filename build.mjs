import { cpSync, mkdirSync } from 'node:fs';
import { glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import * as esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const isWatch = process.argv.includes('--watch');

const USERSCRIPT_BANNER = `// ==UserScript==
// @name         amo stickers
// @version      0.1.0
// @match        https://*.amo.tm/*
// @match        http://localhost:3000/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==`;

const TAILWIND_CONFIG = 'tailwind.config.ts';

/**
 * Компоненты, по классам которых Tailwind собирает CSS пикера. Вместе с
 * `tailwind.config.ts` они идут в `watchFiles`: конфиг в бандл не входит, и без
 * явной подписки новый токен не пересобрал бы CSS в `watch`.
 */
const TAILWIND_WATCH_GLOB = 'src/core/ui/**/*.tsx';

/**
 * Конфиг читается на каждой сборке заново: ESM-модуль кэшируется по URL, и без
 * метки в query `watch` продолжал бы собирать CSS по старым токенам.
 */
const loadTailwindConfig = async () => {
  const { tailwindConfig } = await import(`./${TAILWIND_CONFIG}?t=${Date.now()}`);

  return tailwindConfig;
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
cpSync('src/extension/manifest.json', 'dist/extension/manifest.json');

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
