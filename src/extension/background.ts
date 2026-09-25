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

/**
 * Сколько символов тела ответа попадает в текст ошибки — достаточно, чтобы понять причину,
 * и не раздувает сообщение HTML-страницей ошибки.
 */
const ERROR_BODY_PREVIEW = 200;

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let bin = '';

  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    bin += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_SIZE));
  }

  return btoa(bin);
};

const readBody = async (
  res: Response,
  as: FetchRequest['as']
): Promise<FetchResponse> => {
  switch (as) {
    case 'json': {
      return { ok: true, json: await res.json() };
    }

    case 'blob': {
      const blob = await res.blob();

      return { ok: true, base64: toBase64(await blob.arrayBuffer()), mime: blob.type };
    }

    default: {
      const unknownAs: never = as;

      throw new Error(`Unknown response format: ${String(unknownAs)}`);
    }
  }
};

const handleFetch = async ({ url, as }: FetchRequest): Promise<FetchResponse> => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text().catch(() => {
        return '';
      });

      return {
        ok: false,
        error: `HTTP ${res.status} ${body.slice(0, ERROR_BODY_PREVIEW)}`,
      };
    }

    return await readBody(res, as);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
chrome.runtime.onMessage.addListener((msg: FetchRequest, _sender, sendResponse) => {
  if (msg?.type !== 'amo-stickers:fetch') return false;
  void respond(msg, sendResponse);

  return true;
});
