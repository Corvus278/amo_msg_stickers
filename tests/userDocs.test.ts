import { describe, expect, it } from 'vitest';

import docsConfigSource from '../docs/.vitepress/config.mts?raw';
import { USER_DOCS_PAGE, USER_DOCS_URL, userDocsUrl } from '../src/core/userDocs';

/**
 * Литерал `base` в конфиге VitePress: адрес сайта на Pages — хост плюс эта база.
 */
const BASE_PATTERN = /\bbase:\s*'([^']+)'/;

const PAGES = Object.values(USER_DOCS_PAGE);

describe('userDocs', () => {
  it('база адреса совпадает с base сайта доки', () => {
    const base = BASE_PATTERN.exec(docsConfigSource)?.[1];

    expect(base).toBeDefined();
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

  it.each(PAGES)('у страницы %s есть исходник в docs/', async (page) => {
    /**
     * Импорт с `?raw` падает, если файла нет: переименование страницы доки без правки
     * ядра ломает тест, а не ссылку у пользователя.
     *
     * Адрес собирается в переменной с `@vite-ignore`: шаблон в самом `import()` vite
     * разбирает статически и разрешает переменную только на один уровень каталога, а
     * страницы лежат глубже.
     */
    const specifier = `../docs/${page}.md?raw`;
    const { default: source } = await import(/* @vite-ignore */ specifier);

    expect(source.length).toBeGreaterThan(0);
  });

  it.each(PAGES)('адрес страницы %s — база и путь без .md', (page) => {
    expect(userDocsUrl(page)).toBe(`${USER_DOCS_URL}${page}`);
  });
});
