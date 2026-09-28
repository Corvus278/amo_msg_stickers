import { describe, expect, it } from 'vitest';

/**
 * Каталог страниц доки относительно теста: ключи `import.meta.glob` начинаются с него.
 */
const CONTENT_DIR = '../docs/content/';

/**
 * Каталог английских страниц внутри `docs/content/` — адрес локали `en` в VitePress.
 */
const EN_DIR = 'en/';

/**
 * Исходники страниц: фрагменты `_parts/` страницами не собираются, и у английского фрагмента
 * свой каталог внутри `_parts/`, поэтому они в сверку не входят. Нужны только пути, файлы не
 * загружаются.
 */
const SOURCE_PATHS = Object.keys(
  import.meta.glob(['../docs/content/**/*.md', '!../docs/content/_parts/**'])
).map((path) => {
  return path.slice(CONTENT_DIR.length);
});

/**
 * Пути страниц одного языка относительно корня его локали, по алфавиту.
 *
 * @param isEnglish — английские страницы, иначе русские
 * @returns пути исходников без каталога языка
 */
const localePages = (isEnglish: boolean): string[] => {
  return SOURCE_PATHS.reduce<string[]>((pages, path) => {
    if (path.startsWith(EN_DIR) === isEnglish) {
      pages.push(isEnglish ? path.slice(EN_DIR.length) : path);
    }

    return pages;
  }, []).sort();
};

describe('пары страниц доки', () => {
  const ruPages = localePages(false);
  const enPages = localePages(true);

  it('страницы найдены на обоих языках', () => {
    expect(ruPages).toContain('index.md');
    expect(enPages).toContain('index.md');
  });

  /**
   * Одна сверка на оба направления: страница без перевода и перевод без русской страницы
   * одинаково роняют тест, а у читателя переключатель языка VitePress вёл бы на 404.
   */
  it('у каждой русской страницы есть английская и наоборот', () => {
    expect(enPages).toEqual(ruPages);
  });
});
