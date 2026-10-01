export type ServiceAccountKey = {
  /**
   * Почта сервисного аккаунта — она же добавлена в аккаунт издателя Chrome Web Store.
   */
  clientEmail: string;
  /**
   * Закрытый ключ PKCS#8 в PEM из JSON-ключа сервисного аккаунта.
   */
  privateKey: string;
};

export type StoreItem = {
  /**
   * ID издателя из раздела «Publisher → Settings» Developer Dashboard.
   */
  publisherId: string;
  /**
   * ID расширения в Chrome Web Store.
   */
  itemId: string;
};

export type PublishOptions = StoreItem & {
  /**
   * JSON-ключ сервисного аккаунта текстом, как он лежит в секрете.
   */
  serviceAccountKey: string;
  /**
   * Версия из manifest пакета: по ней видно, что версия уже в сторе.
   */
  version: string;
  /**
   * ZIP пакета с `manifest.json` в корне.
   */
  zip: Blob;
  /**
   * `fetch` параметром — тесты подменяют сеть.
   */
  fetchFn: typeof fetch;
  /**
   * Пауза между опросами статуса загрузки; тесты не ждут.
   */
  sleep: (ms: number) => Promise<void>;
  /**
   * Текущее время в секундах — для срока жизни JWT.
   */
  nowSeconds: number;
};

export type PublishResult =
  | {
      /**
       * Версия уже загружена в стор прошлым прогоном: повторно не загружается.
       */
      outcome: 'already-in-store';
      /**
       * Состояние ревизии с этой версией в сторе.
       */
      state: string;
    }
  | {
      /**
       * Пакет загружен и отправлен на публикацию.
       */
      outcome: 'submitted';
      /**
       * Состояние отправки из ответа `publish`, обычно `PENDING_REVIEW`.
       */
      state: string;
    };

export type StoreApi = {
  /**
   * `fetch` из параметров публикации.
   */
  fetchFn: typeof fetch;
  /**
   * Издатель и расширение — путь ресурса в API.
   */
  item: StoreItem;
  /**
   * Значение заголовка `Authorization` с access token.
   */
  authorization: string;
};
