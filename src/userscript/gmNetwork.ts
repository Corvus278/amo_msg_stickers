import type { HostNetwork } from '../core/host.types';
import {
  assertAllowedUrl,
  httpError,
  isAllowedUrl,
  NOT_ALLOWED,
  tooBigError,
} from '../core/net';

import {
  type GmResponse,
  type GmResponseType,
  type GmXmlhttpRequest,
  isArrayBuffer,
} from './gm.types';

/**
 * Сеть userscript через API менеджера: запросы идут в обход CORS страницы, а политика адресов,
 * тексты ошибок и лимит размера — те же, что у расширения (`core/net.ts`).
 */

/**
 * `readyState`, на котором уже известны статус и заголовки, а тело ещё не читалось.
 */
const HEADERS_RECEIVED = 2;

const OK_STATUS_MIN = 200;
const OK_STATUS_MAX = 299;

/**
 * У JSON-ответа лимита нет — как у `fetchJson` расширения.
 */
const NO_LIMIT = Number.POSITIVE_INFINITY;

/**
 * Тексты без адреса запроса: в пути запросов к Telegram лежит токен бота, а текст ошибки
 * показывается в попапе и пишется в консоль.
 */
const NETWORK_ERROR = 'Сетевая ошибка';
const TIMEOUT_ERROR = 'Сервер не ответил вовремя';
const ABORT_ERROR = 'Запрос прерван';

/**
 * Менеджер отдал тело `arraybuffer`-запроса не байтами: пустой Blob ушёл бы дальше как
 * стикер, поэтому это ошибка.
 */
export const BODY_NOT_BYTES = 'Ответ пришёл не байтами';

/**
 * Значение заголовка из строки `responseHeaders`. Имя сравнивается без учёта регистра:
 * менеджеры отдают заголовки так, как их прислал сервер.
 *
 * @param headers — заголовки ответа одной строкой
 * @param name — имя заголовка в нижнем регистре
 * @returns значение заголовка; пустая строка — заголовка нет
 */
const headerValue = (headers: string, name: string) => {
  const line = headers.split(/\r?\n/).find((row) => {
    const colon = row.indexOf(':');

    return colon > 0 && row.slice(0, colon).trim().toLowerCase() === name;
  });

  return line ? line.slice(line.indexOf(':') + 1).trim() : '';
};

/**
 * Тело ответа текстом — для JSON и для текста ошибки не-2xx ответа, в том числе у
 * `arraybuffer`-запроса.
 *
 * @param response — ответ менеджера
 * @returns тело текстом; пустая строка — тела нет
 */
const bodyText = ({ response, responseText }: GmResponse) => {
  if (isArrayBuffer(response)) return new TextDecoder().decode(response);
  if (typeof response === 'string') return response;

  return responseText || '';
};

const isOkStatus = (status: number) => {
  return status >= OK_STATUS_MIN && status <= OK_STATUS_MAX;
};

/**
 * 0 — статус ещё не известен (или ответа нет), это не HTTP-ошибка.
 *
 * @param status — HTTP-статус из ответа менеджера
 * @returns true, если сервер ответил не-2xx
 */
const isErrorStatus = (status: number) => {
  return status > 0 && !isOkStatus(status);
};

/**
 * Запрос через менеджер в рамках сетевой политики. Адрес вне политики — исключение без
 * обращения к сети. Итоговый адрес после редиректа, статус и размер проверяются до того, как
 * ответ отдаётся вызывающей стороне; тело больше `maxBytes` обрывает загрузку.
 *
 * @param request — `GM_xmlhttpRequest` или его подмена
 * @param url — адрес запроса
 * @param responseType — формат тела ответа
 * @param maxBytes — предел размера тела
 * @returns успешно загруженный ответ
 */
const send = (
  request: GmXmlhttpRequest,
  url: string,
  responseType: GmResponseType,
  maxBytes: number
) => {
  assertAllowedUrl(url);

  return new Promise<GmResponse>((resolve, reject) => {
    let isSettled = false;
    let shouldAbort = false;

    /**
     * Менеджер (и мок в тестах) может позвать колбэк синхронно, ещё до того, как вернул
     * handle, — тогда обрыв откладывается до возврата из `request`.
     */
    let abortRequest = () => {
      shouldAbort = true;
    };

    const fail = (error: Error) => {
      if (isSettled) return;
      isSettled = true;
      reject(error);
    };

    /**
     * Флаг ставится до `abort()`: менеджер может позвать `onabort` синхронно, и тот не
     * должен подменить причину обрыва.
     */
    const stop = (error: Error) => {
      if (isSettled) return;
      fail(error);
      abortRequest();
    };

    const isAllowedFinalUrl = ({ finalUrl }: GmResponse) => {
      return isAllowedUrl(finalUrl || url);
    };

    /**
     * Статус с заголовков: не каждый менеджер кладёт его в `onprogress`.
     */
    let headersStatus = 0;

    /**
     * Причина обрыва по лимиту. Не-2xx статус важнее размера: вызывающей стороне нужна
     * HTTP-ошибка, какие бы колбэки ни позвал менеджер, а тело сверх лимита не дочитывается —
     * в тексте то, что успело прийти.
     *
     * @param response — ответ менеджера на момент превышения лимита
     * @returns ошибка для `stop`
     */
    const overLimitError = (response: GmResponse) => {
      const status = response.status || headersStatus;

      return isErrorStatus(status)
        ? httpError(status, bodyText(response))
        : tooBigError(maxBytes);
    };

    const handle = request({
      method: 'GET',
      url,
      responseType,
      anonymous: true,
      onreadystatechange: (response) => {
        if (response.readyState !== HEADERS_RECEIVED) return;

        headersStatus = response.status;

        if (!isAllowedFinalUrl(response)) {
          stop(new Error(NOT_ALLOWED));
        } else if (
          Number(headerValue(response.responseHeaders, 'content-length')) > maxBytes
        ) {
          stop(overLimitError(response));
        }
      },
      onprogress: (response) => {
        if ((response.loaded || 0) > maxBytes) stop(overLimitError(response));
      },
      onload: (response) => {
        const { status, response: body } = response;

        if (!isAllowedFinalUrl(response)) {
          stop(new Error(NOT_ALLOWED));
        } else if (!isOkStatus(status)) {
          fail(httpError(status, bodyText(response)));
        } else if (isArrayBuffer(body) && body.byteLength > maxBytes) {
          stop(tooBigError(maxBytes));
        } else if (!isSettled) {
          isSettled = true;
          resolve(response);
        }
      },
      onerror: () => {
        fail(new Error(NETWORK_ERROR));
      },
      ontimeout: () => {
        fail(new Error(TIMEOUT_ERROR));
      },
      onabort: () => {
        fail(new Error(ABORT_ERROR));
      },
    });

    abortRequest = () => {
      handle.abort();
    };

    if (shouldAbort) handle.abort();
  });
};

/**
 * Сеть userscript через `GM_xmlhttpRequest`: в обход CORS страницы и без cookie целевых
 * сайтов. Ошибки — те же тексты, что у расширения: «Адрес вне списка разрешённых» (в том
 * числе для итогового адреса после редиректа), «Файл больше N МБ», `HTTP <код> <начало тела>`.
 *
 * @param request — `GM_xmlhttpRequest` менеджера; в тестах — мок
 * @returns сетевой контракт окружения
 */
export const gmNetwork = (request: GmXmlhttpRequest): HostNetwork => {
  return {
    async fetchJson(url) {
      const response = await send(request, url, 'text', NO_LIMIT);
      const json: unknown = JSON.parse(bodyText(response));

      return json;
    },
    async fetchBlob(url, maxBytes) {
      const response = await send(request, url, 'arraybuffer', maxBytes);
      const { response: body, responseHeaders } = response;

      if (!isArrayBuffer(body)) throw new Error(BODY_NOT_BYTES);

      return new Blob([body], { type: headerValue(responseHeaders, 'content-type') });
    },
  };
};
