import { start } from '../core/app';
import { DEFAULT_SETTINGS } from '../core/host';
import type { Host, Settings } from '../core/host.types';

import type { FetchRequest, FetchResponse } from './messages.types';

const bgFetch = async (url: string, as: FetchRequest['as']) => {
  const res: FetchResponse = await chrome.runtime.sendMessage({
    type: 'amo-stickers:fetch',
    url,
    as,
  } satisfies FetchRequest);

  if (!res?.ok) throw new Error(res?.error || 'fetch failed');

  return res;
};

const host: Host = {
  name: 'extension',
  async fetchJson<T>(url: string) {
    const { json } = await bgFetch(url, 'json');

    /**
     * Форму JSON не проверяем: по контракту `Host.fetchJson` за `T` отвечает вызывающая сторона.
     */
    return json as T;
  },
  async fetchBlob(url: string) {
    const { base64, mime } = await bgFetch(url, 'blob');
    const bytes = Uint8Array.from(atob(base64 || ''), (char) => {
      return char.charCodeAt(0);
    });

    return new Blob([bytes], { type: mime || '' });
  },
  async getSettings() {
    const { settings } = await chrome.storage.local.get('settings');

    /**
     * Ключ `settings` пишет только `setSettings` ниже, поэтому там либо пусто, либо
     * (частичные) `Settings`.
     */
    return { ...DEFAULT_SETTINGS, ...(settings as Partial<Settings> | undefined) };
  },
  async setSettings(patch) {
    const current = await this.getSettings();

    await chrome.storage.local.set({ settings: { ...current, ...patch } });
  },
};

start(host);
