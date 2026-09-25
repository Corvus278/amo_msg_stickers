/**
 * Проверка версии для CI: три места записи версии совпадают, а с `--base <ref>` —
 * версия выше, чем в `package.json` базы. Ошибки печатаются аннотациями GitHub
 * (`::error::`), код выхода 1.
 *
 * Запуск: `node scripts/check-version.mjs [--base origin/master]`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import {
  checkVersionConsistency,
  checkVersionGrowth,
  readBannerVersion,
  toErrorAnnotation,
} from './version.ts';

const readJsonVersion = (path) => {
  return JSON.parse(readFileSync(path, 'utf8')).version;
};

const reportError = (message) => {
  console.error(toErrorAnnotation(message));
  process.exitCode = 1;
};

const {
  values: { base },
} = parseArgs({ options: { base: { type: 'string' } } });

const version = readJsonVersion('package.json');
const consistencyError = checkVersionConsistency([
  { source: 'package.json', version },
  {
    source: 'src/extension/manifest.json',
    version: readJsonVersion('src/extension/manifest.json'),
  },
  {
    source: 'build.mjs (@version)',
    version: readBannerVersion(readFileSync('build.mjs', 'utf8')),
  },
]);

if (consistencyError) {
  reportError(consistencyError);
}

if (base) {
  try {
    const baseVersion = JSON.parse(
      execFileSync('git', ['show', `${base}:package.json`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    ).version;
    const growthError = checkVersionGrowth(version, baseVersion);

    if (growthError) {
      reportError(growthError);
    }
  } catch (error) {
    reportError(error.message);
  }
}

if (!process.exitCode) {
  console.info(`Версия ${version}: проверка пройдена`);
}
