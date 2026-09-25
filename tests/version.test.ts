import { describe, expect, it } from 'vitest';

import {
  checkVersionConsistency,
  checkVersionGrowth,
  compareVersions,
  parseVersion,
  readBannerVersion,
} from '../scripts/version';

describe('parseVersion', () => {
  it('разбирает MAJOR.MINOR.PATCH в числа', () => {
    expect(parseVersion('1.20.3')).toEqual({ major: 1, minor: 20, patch: 3 });
  });

  it.each(['0.3', 'v0.3.0', '0.3.0-beta', '', 'a.b.c'])('отклоняет «%s»', (value) => {
    expect(() => {
      return parseVersion(value);
    }).toThrow('MAJOR.MINOR.PATCH');
  });
});

describe('compareVersions', () => {
  it('сравнивает по числам, а не по строке', () => {
    expect(
      compareVersions(parseVersion('0.10.0'), parseVersion('0.9.0'))
    ).toBeGreaterThan(0);
  });

  it('мажор важнее минора и патча', () => {
    expect(
      compareVersions(parseVersion('1.0.0'), parseVersion('0.99.99'))
    ).toBeGreaterThan(0);
  });

  it('равные версии дают 0', () => {
    expect(compareVersions(parseVersion('0.3.0'), parseVersion('0.3.0'))).toBe(0);
  });
});

describe('readBannerVersion', () => {
  it('находит @version в заголовке userscript', () => {
    const banner =
      '// ==UserScript==\n// @name         amo stickers\n// @version      0.3.0\n// ==/UserScript==';

    expect(readBannerVersion(banner)).toBe('0.3.0');
  });

  it('возвращает undefined, если @version нет', () => {
    expect(
      readBannerVersion('// ==UserScript==\n// @name amo\n// ==/UserScript==')
    ).toBeUndefined();
  });
});

describe('checkVersionConsistency', () => {
  it('молчит, когда версии совпадают', () => {
    expect(
      checkVersionConsistency([
        { source: 'package.json', version: '0.3.0' },
        { source: 'manifest.json', version: '0.3.0' },
        { source: 'build.mjs', version: '0.3.0' },
      ])
    ).toBeUndefined();
  });

  it('перечисляет все значения с источниками при расхождении', () => {
    const error = checkVersionConsistency([
      { source: 'package.json', version: '0.4.0' },
      { source: 'manifest.json', version: '0.3.0' },
      { source: 'build.mjs', version: '0.3.0' },
    ]);

    expect(error).toContain('package.json — 0.4.0');
    expect(error).toContain('manifest.json — 0.3.0');
    expect(error).toContain('build.mjs — 0.3.0');
  });

  it('считает ненайденную версию расхождением', () => {
    const error = checkVersionConsistency([
      { source: 'package.json', version: '0.3.0' },
      { source: 'build.mjs', version: undefined },
    ]);

    expect(error).toContain('build.mjs — не найдена');
  });
});

describe('checkVersionGrowth', () => {
  it.each([
    ['0.3.0', '0.2.0'],
    ['0.10.0', '0.9.0'],
    ['1.0.0', '0.9.0'],
  ])('%s выше %s — проходит', (current, base) => {
    expect(checkVersionGrowth(current, base)).toBeUndefined();
  });

  it.each([
    ['0.3.0', '0.3.0'],
    ['0.2.0', '0.3.0'],
    ['0.9.0', '0.10.0'],
  ])('%s не выше %s — просит поднять версию', (current, base) => {
    expect(checkVersionGrowth(current, base)).toContain('поднимите версию');
  });

  it('падает на невалидной версии базы', () => {
    expect(() => {
      return checkVersionGrowth('0.3.0', 'master');
    }).toThrow('MAJOR.MINOR.PATCH');
  });
});
