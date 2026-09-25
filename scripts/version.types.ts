export type Version = {
  /**
   * Несовместимые изменения: схема IndexedDB, переделка продукта.
   */
  major: number;
  /**
   * Обычный PR.
   */
  minor: number;
  /**
   * Исправления.
   */
  patch: number;
};

export type VersionSource = {
  /**
   * Где записана версия — попадает в текст ошибки.
   */
  source: string;
  /**
   * Версия; `undefined` — в источнике её не нашли.
   */
  version: string | undefined;
};
