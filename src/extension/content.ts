import { start } from '../core/app';
import { DEFAULT_SETTINGS } from '../core/host';
import type { Host, Settings } from '../core/host.types';

import type { FetchRequest, FetchResponse } from './messages.types';

const bgFetch = async (request: FetchRequest) => {
  const res: FetchResponse = await chrome.runtime.sendMessage(request);

  if (!res?.ok) throw new Error(res?.error || 'fetch failed');

  return res;
};

const host: Host = {
  name: 'extension',
  async fetchJson(url) {
    const { json } = await bgFetch({ type: 'amo-stickers:fetch', url, as: 'json' });

    return json;
  },
  async fetchBlob(url, maxBytes) {
    const { base64, mime } = await bgFetch({
      type: 'amo-stickers:fetch',
      url,
      as: 'blob',
      maxBytes,
    });
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
