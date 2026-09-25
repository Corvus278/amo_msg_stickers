type FetchRequestBase = {
  /**
   * Метка сообщения: service worker отвечает только на свои запросы.
   */
  type: 'amo-stickers:fetch';

  /**
   * Адрес запроса.
   */
  url: string;
};

type FetchJsonRequest = {
  /**
   * Вернуть тело ответа распарсенным JSON.
   */
  as: 'json';
};

type FetchBlobRequest = {
  /**
   * Вернуть тело ответа base64-байтами.
   */
  as: 'blob';

  /**
   * Предел размера тела: service worker прерывает чтение на превышении, не передавая байты
   * в content script.
   */
  maxBytes: number;
};

export type FetchRequest = FetchRequestBase & (FetchJsonRequest | FetchBlobRequest);

export type FetchResponse =
  | {
      /**
       * Запрос выполнен.
       */
      ok: true;

      /**
       * Тело ответа при `as: 'json'`.
       */
      json?: unknown;

      /**
       * Байты ответа в base64 при `as: 'blob'`: Blob через runtime-сообщение не передаётся.
       */
      base64?: string;

      /**
       * MIME-тип ответа при `as: 'blob'`.
       */
      mime?: string;
    }
  | {
      /**
       * Запрос не выполнен.
       */
      ok: false;

      /**
       * Причина ошибки: HTTP-статус с началом тела или текст исключения.
       */
      error: string;
    };
