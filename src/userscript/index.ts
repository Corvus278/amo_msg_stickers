import { start } from '../core/app';
import { DEFAULT_SETTINGS } from '../core/host';
import type { Host, Settings } from '../core/host.types';

/**
 * Вариант для менеджеров userscript-ов (Tampermonkey и т. п.).
 *
 * Сеть — прямым fetch со страницы, поэтому запросы подчиняются её CORS.
 */

const SETTINGS_KEY = 'amo-stickers:settings';

/**
 * Сколько символов тела ответа попадает в текст ошибки — достаточно, чтобы понять причину,
 * и не раздувает сообщение HTML-страницей ошибки.
 */
const ERROR_BODY_PREVIEW = 200;

const fetchChecked = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => {
      return '';
    });

    throw new Error(`HTTP ${res.status} ${body.slice(0, ERROR_BODY_PREVIEW)}`);
  }

  return res;
};

const host: Host = {
  name: 'userscript',
  async fetchJson<T>(url: string) {
    const res = await fetchChecked(url);

    /**
     * Форму JSON не проверяем: по контракту `Host.fetchJson` за `T` отвечает вызывающая сторона.
     */
    return (await res.json()) as T;
  },
  async fetchBlob(url: string) {
    const res = await fetchChecked(url);

    return res.blob();
  },
  async getSettings() {
    try {
      /**
       * Ключ пишет только `setSettings` ниже, поэтому там либо пусто, либо (частичные)
       * `Settings`; битый JSON уходит в catch.
       */
      const stored = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || '{}'
      ) as Partial<Settings>;

      return { ...DEFAULT_SETTINGS, ...stored };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  async setSettings(patch) {
    const current = await this.getSettings();

    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
  },
};

const boot = () => {
  start(host);
};

if (document.body) boot();
else document.addEventListener('DOMContentLoaded', boot, { once: true });
