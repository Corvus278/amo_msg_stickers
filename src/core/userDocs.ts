import type { UserDocsPage } from './userDocs.types';

/**
 * Сайт доки на GitHub Pages проекта. Путь совпадает с `base` в `docs/.vitepress/config.mts` —
 * их сверяет тест.
 */
export const USER_DOCS_URL = 'https://mcar2107.github.io/amo_msg_stickers/';

/**
 * Страницы, на которые ссылается интерфейс, — пути исходников в `docs/` без `.md`: сайт собран
 * с `cleanUrls`, и адрес страницы — база плюс этот путь.
 *
 * Язык не параметр: английской доки нет, и ссылки из обоих языков интерфейса ведут на русскую.
 */
export const USER_DOCS_PAGE = {
  gifKeys: 'setup/gif-keys',
  telegram: 'setup/telegram',
} as const;

/**
 * @param page — страница доки
 * @returns полный адрес страницы
 */
export const userDocsUrl = (page: UserDocsPage): string => {
  return `${USER_DOCS_URL}${page}`;
};
