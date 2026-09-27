import type { USER_DOCS_PAGE } from './userDocs';

/**
 * Страница доки, на которую ссылается интерфейс: путь исходника в `docs/` без `.md`.
 */
export type UserDocsPage = (typeof USER_DOCS_PAGE)[keyof typeof USER_DOCS_PAGE];
