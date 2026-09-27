import type {
  Locale,
  MessageArgs,
  MessageKey,
  MessageParam,
  Messages,
} from './i18n.types';
import { EN } from './messages.en';
import { RU } from './messages.ru';

const MESSAGES: Readonly<Record<Locale, Messages>> = { ru: RU, en: EN };

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Язык не меняется до перезагрузки страницы, поэтому он — состояние модуля без подписок. Русский по
 * умолчанию: это запасной язык amo, и код вне `start()` (тесты, фоновый мир) получает его без настройки.
 */
let currentLocale: Locale = 'ru';

/**
 * @param locale — язык интерфейса до перезагрузки страницы
 */
export const setLocale = (locale: Locale) => {
  currentLocale = locale;
};

export const getLocale = (): Locale => {
  return currentLocale;
};

/**
 * Подстановка без параметра остаётся в тексте как есть — пропуск виден в интерфейсе, а не теряется молча.
 *
 * @param template — строка словаря с подстановками `{name}`
 * @param params — значения подстановок
 * @returns строка с подставленными значениями
 */
export const formatMessage = (
  template: string,
  params: Readonly<Record<string, MessageParam>> = {}
) => {
  return template.replaceAll(PLACEHOLDER, (placeholder, name: string) => {
    return Object.hasOwn(params, name) ? String(params[name]) : placeholder;
  });
};

/**
 * @param key — ключ словаря
 * @param args — подстановки строки, если они в ней есть
 * @returns текст на текущем языке
 */
export const t = <K extends MessageKey>(key: K, ...[params]: MessageArgs<K>): string => {
  return formatMessage(MESSAGES[currentLocale][key], params);
};

/**
 * Ошибка, текст которой можно воссоздать на другом языке: ключ и параметры переживают передачу через
 * границу service worker, а текст — нет, он на языке мира, где ошибка создана.
 */
export class LocalizedError<K extends MessageKey = MessageKey> extends Error {
  /**
   * Ключ словаря, по которому собран текст
   */
  readonly key: K;

  /**
   * Подстановки текста; `undefined` — у строки их нет. Тип — первый аргумент после ключа, а не
   * `MessageParams<K> | undefined`: для обобщённого `K` компилятор не сводит одно к другому, когда у строк
   * словаря разные имена подстановок.
   */
  readonly params: MessageArgs<K>[0];

  constructor(key: K, ...args: MessageArgs<K>) {
    super(t(key, ...args));
    this.name = 'LocalizedError';
    this.key = key;
    [this.params] = args;
  }
}
