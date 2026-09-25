import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import * as esbuild from 'esbuild';

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
  '// @version      0.2.0',
  ...['https://*.amo.tm/*', ...devMatches].map((match) => {
    return `// @match        ${match}`;
  }),
  '// @grant        none',
  '// @run-at       document-idle',
  '// ==/UserScript==',
].join('\n');

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
