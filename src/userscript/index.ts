import { start } from '../core/app';
import { DEFAULT_SETTINGS } from '../core/host';
import type { Host, Settings } from '../core/host.types';
import { fetchChecked, readResponseLimited } from '../core/net';

/**
 * Вариант для менеджеров userscript-ов (Tampermonkey и т. п.).
 *
 * Сеть — прямым fetch со страницы, поэтому запросы подчиняются её CORS.
 */

const SETTINGS_KEY = 'amo-stickers:settings';

const host: Host = {
  name: 'userscript',
  async fetchJson(url) {
    const res = await fetchChecked(url);

    return res.json();
  },
  async fetchBlob(url, maxBytes) {
    const res = await fetchChecked(url);
    const bytes = await readResponseLimited(res, maxBytes);

    return new Blob([bytes], { type: res.headers.get('content-type') || '' });
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
