import type { Locale } from './i18n.types';

/**
 * Ключ, под которым amo web хранит применённый язык: мы идём за языком страницы, а не браузера, и выбор
 * языка в amo, если он появится, подхватится без правок.
 */
export const AMO_LOCALE_KEY = 'i18nextLng';

/**
 * Разделители основного тега и региона: `en-US` у браузера, `en_GB` встречается в сохранённых значениях.
 */
const TAG_SEPARATOR = /[-_]/;

/**
 * Правило amo: английский — только при основном теге `en`, любой другой язык и отсутствие языка дают русский —
 * запасной язык amo.
 *
 * @param stored — язык, сохранённый amo; `null` или пустая строка — не сохранён
 * @param languages — языки браузера по приоритету
 * @returns язык интерфейса
 */
export const resolveLocale = (
  stored: string | null,
  languages: readonly string[]
): Locale => {
  const [primary] = (stored || languages[0] || '').split(TAG_SEPARATOR);

  if (primary?.toLowerCase() === 'en') return 'en';

  return 'ru';
};

/**
 * `localStorage` бросает при запрете хранилища сайта и в части приватных режимов — тогда язык берётся из
 * языков браузера, и пикер работает.
 *
 * @returns сохранённое значение; `null` — значения нет или хранилище недоступно
 */
const readStoredLocale = (): string | null => {
  try {
    return localStorage.getItem(AMO_LOCALE_KEY);
  } catch {
    return null;
  }
};

/**
 * Пустой список `navigator.languages` не ломает выбор: тогда язык берётся из `navigator.language`.
 *
 * @returns язык интерфейса по языку amo
 */
export const readAmoLocale = (): Locale => {
  const { languages, language } = navigator;

  return resolveLocale(readStoredLocale(), languages.length > 0 ? languages : [language]);
};
