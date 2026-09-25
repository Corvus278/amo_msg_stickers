import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { FetchRequest, FetchResponse } from '../src/extension/messages.types';

import { mockResponse } from './helpers/mockResponse';

type Listener = (
  msg: FetchRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: FetchResponse) => void
) => boolean;

const EXTENSION_ID = 'own-extension';

/**
 * Каст частичной структуры: SW смотрит только на наличие вкладки у отправителя, остальные
 * два десятка полей `Tab` тесту не нужны.
 */
const TAB = { id: 1 } as chrome.tabs.Tab;
const CONTENT_SCRIPT: chrome.runtime.MessageSender = { id: EXTENSION_ID, tab: TAB };

let listener: Listener | null = null;

/**
 * Отправляет сообщение слушателю SW и ждёт ответа. null — слушатель не взялся отвечать.
 *
 * @param msg — сообщение
 * @param sender — отправитель
 * @returns ответ SW или null
 */
const send = (msg: FetchRequest, sender = CONTENT_SCRIPT) => {
  return new Promise<FetchResponse | null>((resolve) => {
    const isAsync = listener?.(msg, sender, resolve);

    if (!isAsync) resolve(null);
  });
};

beforeAll(async () => {
  vi.stubGlobal('chrome', {
    runtime: {
      id: EXTENSION_ID,
      onMessage: {
        addListener: (fn: Listener) => {
          listener = fn;
        },
      },
    },
  });
  await import('../src/extension/background');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('service worker', () => {
  it('не ходит на чужой хост', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const res = await send({
      type: 'amo-stickers:fetch',
      url: 'https://evil.example/x.gif',
      as: 'blob',
      maxBytes: 100,
    });

    expect(res).toEqual({ ok: false, error: 'Адрес вне списка разрешённых' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('отклоняет редирект на чужой хост', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse('{}', { url: 'https://evil.example/' })
    );

    const res = await send({
      type: 'amo-stickers:fetch',
      url: 'https://api.giphy.com/v1/gifs/trending',
      as: 'json',
    });

    expect(res).toEqual({ ok: false, error: 'Адрес вне списка разрешённых' });
  });

  it.each<[string, chrome.runtime.MessageSender]>([
    ['другое расширение', { id: 'other', tab: TAB }],
    ['страница расширения без вкладки', { id: EXTENSION_ID }],
  ])('не отвечает на сообщение: %s', async (_name, sender) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const res = await send(
      { type: 'amo-stickers:fetch', url: 'https://api.giphy.com/v1/x', as: 'json' },
      sender
    );

    expect(res).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('прерывает загрузку больше лимита', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse(new Uint8Array(3 * 1024 * 1024), {
        url: 'https://media.giphy.com/x.gif',
      })
    );

    const res = await send({
      type: 'amo-stickers:fetch',
      url: 'https://media.giphy.com/x.gif',
      as: 'blob',
      maxBytes: 2 * 1024 * 1024,
    });

    expect(res).toEqual({ ok: false, error: 'Файл больше 2 МБ' });
  });

  it('отдаёт файл в пределах лимита base64-байтами с MIME', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse(new Uint8Array([71, 73, 70]), {
        url: 'https://media.giphy.com/x.gif',
        headers: { 'content-type': 'image/gif' },
      })
    );

    const res = await send({
      type: 'amo-stickers:fetch',
      url: 'https://media.giphy.com/x.gif',
      as: 'blob',
      maxBytes: 100,
    });

    expect(res).toEqual({ ok: true, base64: btoa('GIF'), mime: 'image/gif' });
  });
});
