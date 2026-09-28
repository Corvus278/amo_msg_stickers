import { describe, expect, it } from 'vitest';

import docsConfigSource from '../docs/.vitepress/config.mts?raw';
import { USER_DOCS_PAGE, USER_DOCS_URL, userDocsUrl } from '../src/core/userDocs';

/**
 * База сайта в конфиге VitePress: адрес сайта на Pages — хост плюс эта база. Литерал
 * лежит в константе `BASE`: её берут и `base`, и ссылки `head`.
 */
const BASE_PATTERN = /\bconst BASE\s*=\s*'([^']+)'/;

const PAGES = Object.values(USER_DOCS_PAGE);

describe('userDocs', () => {
  it('база адреса совпадает с base сайта доки', () => {
    const base = BASE_PATTERN.exec(docsConfigSource)?.[1];

    expect(base).toBeDefined();
    expect(docsConfigSource).toMatch(/\bbase:\s*BASE\b/);
    expect(new URL(USER_DOCS_URL).pathname).toBe(base);
  });

  it('база адреса — https, со слешем в конце', () => {
    const { protocol } = new URL(USER_DOCS_URL);

    expect(protocol).toBe('https:');
    expect(USER_DOCS_URL.endsWith('/')).toBe(true);
  });

  it('модуль ссылается хотя бы на одну страницу', () => {
    expect(PAGES.length).toBeGreaterThan(0);
  });

  it.each(PAGES)('у страницы %s есть исходник в docs/content/', async (page) => {
    /**
     * Импорт с `?raw` падает, если файла нет: переименование страницы доки без правки
     * ядра ломает тест, а не ссылку у пользователя.
     *
     * Адрес собирается в переменной с `@vite-ignore`: шаблон в самом `import()` vite
     * разбирает статически и разрешает переменную только на один уровень каталога, а
     * страницы лежат глубже.
     */
    const specifier = `../docs/content/${page}.md?raw`;
    const { default: source } = await import(/* @vite-ignore */ specifier);

    expect(source.length).toBeGreaterThan(0);
  });

  it.each(PAGES)('адрес страницы %s — база и путь без .md', (page) => {
    expect(userDocsUrl(page)).toBe(`${USER_DOCS_URL}${page}`);
  });
});
