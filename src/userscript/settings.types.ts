import type { GmGetValue, GmSetValue } from './gm.types';

/**
 * Хранилище менеджера userscript-ов: значения лежат вне страницы, и её скрипты до них не
 * доберутся.
 */
export type GmStore = {
  /**
   * Чтение значения по ключу — `GM_getValue`.
   */
  getValue: GmGetValue;

  /**
   * Запись значения по ключу — `GM_setValue`.
   */
  setValue: GmSetValue;
};

/**
 * Срез `Storage` страницы (`localStorage`), которым пользуются адаптеры настроек.
 */
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
