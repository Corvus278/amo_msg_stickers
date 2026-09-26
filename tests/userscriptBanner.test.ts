import { describe, expect, it } from 'vitest';

import buildSource from '../build.mjs?raw';
import { ALLOWED_DOMAINS, ALLOWED_HOSTS } from '../src/core/net';

/**
 * Хост директивы `@connect` в строке заголовка userscript внутри `build.mjs`.
 */
const CONNECT_PATTERN = /\/\/ @connect\s+(\S+?)'/g;

describe('заголовок userscript', () => {
  it('@connect перечисляет ровно хосты сетевой политики', () => {
    const connectHosts = Array.from(buildSource.matchAll(CONNECT_PATTERN), ([, host]) => {
      return host;
    });

    expect(connectHosts.sort()).toEqual([...ALLOWED_HOSTS, ...ALLOWED_DOMAINS].sort());
  });
});
