import { cpSync, mkdirSync } from 'node:fs';

import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const USERSCRIPT_BANNER = `// ==UserScript==
// @name         amo stickers
// @version      0.1.0
// @match        https://*.amo.tm/*
// @match        http://localhost:3000/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==`;

const common = {
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'info',
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
