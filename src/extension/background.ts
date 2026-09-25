import { fetchChecked, readResponseLimited } from '../core/net';

import type { FetchRequest, FetchResponse } from './messages.types';

/**
 * Сеть идёт через service worker: у него host_permissions и нет CORS-ограничений страницы.
 *
 * Сообщения между SW и content script сериализуются в JSON, поэтому бинарь — base64.
 */

/**
 * Байты склеиваем кусками: `String.fromCharCode(...bytes)` на всём буфере упрётся в лимит
 * числа аргументов функции.
 */
const BASE64_CHUNK_SIZE = 0x80_00;

const toBase64 = (bytes: Uint8Array) => {
  let bin = '';

  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    bin += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_SIZE));
  }

  return btoa(bin);
};

const readBody = async (res: Response, request: FetchRequest): Promise<FetchResponse> => {
  switch (request.as) {
    case 'json': {
      return { ok: true, json: await res.json() };
    }

    case 'blob': {
      const bytes = await readResponseLimited(res, request.maxBytes);

      return {
        ok: true,
        base64: toBase64(bytes),
        mime: res.headers.get('content-type') || '',
      };
    }

    default: {
      const unknownRequest: never = request;

      throw new Error(`Unknown response format: ${JSON.stringify(unknownRequest)}`);
    }
  }
};

const handleFetch = async (request: FetchRequest): Promise<FetchResponse> => {
  try {
    return await readBody(await fetchChecked(request.url), request);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Без `externally_connectable` сюда и так приходят только контексты расширения, но
 * отвечаем лишь его content script-ам: других потребителей сети у SW нет, и новая страница
 * расширения не получит сеть в обход этой проверки случайно.
 *
 * @param sender — отправитель сообщения
 * @returns true, если сообщение от content script этого расширения
 */
const isOwnContentScript = ({ id, tab }: chrome.runtime.MessageSender) => {
  return id === chrome.runtime.id && Boolean(tab);
};

const respond = async (
  msg: FetchRequest,
  sendResponse: (response: FetchResponse) => void
) => {
  sendResponse(await handleFetch(msg));
};

/**
 * Слушатель синхронный: `true` держит канал открытым до асинхронного `sendResponse`.
 */
chrome.runtime.onMessage.addListener((msg: FetchRequest, sender, sendResponse) => {
  if (msg?.type !== 'amo-stickers:fetch' || !isOwnContentScript(sender)) return false;
  void respond(msg, sendResponse);

  return true;
});
