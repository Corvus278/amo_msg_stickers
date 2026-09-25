export type FetchRequest = {
  /**
   * Метка сообщения: service worker отвечает только на свои запросы.
   */
  type: 'amo-stickers:fetch';

  /**
   * Адрес запроса.
   */
  url: string;

  /**
   * Как вернуть тело ответа: распарсенным JSON или base64-байтами.
   */
  as: 'json' | 'blob';
};

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
