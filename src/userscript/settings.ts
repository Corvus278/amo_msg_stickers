import { isObject } from '../core/guards';
import { DEFAULT_SETTINGS } from '../core/host';
import type { HostSettings, Settings } from '../core/host.types';

import type { GmStore, SettingsStorage } from './settings.types';

/**
 * Ключ настроек — один и тот же в хранилище менеджера и в `localStorage`: по нему перенос
 * находит настройки, сохранённые без менеджера.
 */
export const SETTINGS_KEY = 'amo-stickers:settings';

/**
 * Ключи берутся из `DEFAULT_SETTINGS`, чтобы новое поле настроек не пришлось дописывать
 * сюда; `Object.keys` типизирован как `string[]`, а объект — ровно `Settings`, поэтому каст.
 */
const SETTINGS_FIELDS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/**
 * Поля настроек из сохранённого значения: известные ключи со строковыми значениями,
 * остальное отбрасывается — ядру уходят только строки, какой бы ни была запись.
 *
 * @param value — значение из хранилища
 * @returns сохранённые поля; не объект — пусто
 */
const pickSettings = (value: unknown): Partial<Settings> => {
  if (!isObject(value)) return {};

  return SETTINGS_FIELDS.reduce<Partial<Settings>>((acc, field) => {
    const fieldValue: unknown = Reflect.get(value, field);

    if (typeof fieldValue === 'string') {
      acc[field] = fieldValue;
    }

    return acc;
  }, {});
};

/**
 * Разбор JSON настроек из `localStorage`.
 *
 * @param raw — строка из хранилища
 * @returns сохранённые поля; null — JSON битый или в нём не объект
 */
const parseStored = (raw: string): Partial<Settings> | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    return isObject(parsed) ? pickSettings(parsed) : null;
  } catch {
    return null;
  }
};

/**
 * Настройки в хранилище менеджера userscript-ов: скрипты страницы до них не доберутся.
 *
 * Хранилище менеджера пусто (ключа нет), а в `storage` лежат настройки, сохранённые без
 * менеджера, — на первом чтении они переносятся в менеджер, а ключ из `storage` удаляется.
 * Битый JSON в `storage` удаляется без переноса. Запись идёт только в менеджер — объектом,
 * сериализует его сам менеджер.
 *
 * @param gmStore — хранилище менеджера
 * @param storage — `localStorage` страницы: источник переноса
 * @returns хранилище настроек для `Host`
 */
export const gmSettings = (gmStore: GmStore, storage: SettingsStorage): HostSettings => {
  const readStored = (): Partial<Settings> => {
    const stored: unknown = gmStore.getValue(SETTINGS_KEY);

    if (stored !== undefined) return pickSettings(stored);

    const raw = storage.getItem(SETTINGS_KEY);

    if (raw === null) return {};

    const legacy = parseStored(raw);

    if (legacy) {
      gmStore.setValue(SETTINGS_KEY, legacy);
    }

    storage.removeItem(SETTINGS_KEY);

    return legacy || {};
  };

  const getSettings = async (): Promise<Settings> => {
    return { ...DEFAULT_SETTINGS, ...readStored() };
  };

  return {
    getSettings,
    async setSettings(patch) {
      const current = await getSettings();

      gmStore.setValue(SETTINGS_KEY, { ...current, ...patch });
    },
  };
};

/**
 * Настройки в `localStorage` страницы — для запуска без менеджера, когда другого хранилища
 * нет. Битый JSON даёт настройки по умолчанию.
 *
 * @param storage — `localStorage` страницы
 * @returns хранилище настроек для `Host`
 */
export const localStorageSettings = (storage: SettingsStorage): HostSettings => {
  const getSettings = async (): Promise<Settings> => {
    const stored = parseStored(storage.getItem(SETTINGS_KEY) || '{}');

    return { ...DEFAULT_SETTINGS, ...stored };
  };

  return {
    getSettings,
    async setSettings(patch) {
      const current = await getSettings();

      storage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
    },
  };
};
