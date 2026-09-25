export type FakeHostInit = {
  /**
   * Ответ на любой `fetchJson`, если не задан `onJson`.
   */
  json?: unknown;

  /**
   * Ответ `fetchJson` в зависимости от адреса — для клиентов с несколькими методами API.
   */
  onJson?: (url: string) => unknown;

  /**
   * Ответ на любой `fetchBlob`. Нет — пустой Blob.
   */
  blob?: Blob;
};
