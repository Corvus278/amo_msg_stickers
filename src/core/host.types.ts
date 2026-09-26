export type Settings = {
  /**
   * API-ключ GIPHY. Пустая строка — поиск GIPHY выключен.
   */
  giphyKey: string;

  /**
   * API-ключ KLIPY. Пустая строка — поиск KLIPY выключен.
   */
  klipyKey: string;

  /**
   * Токен Telegram-бота для импорта наборов. Пустая строка — импорт недоступен.
   */
  telegramToken: string;
};

/**
 * Сеть окружения: запросы в рамках сетевой политики (`core/net.ts`).
 */
export type HostNetwork = {
  /**
   * Загружает JSON по адресу. Форму ответа не проверяет: `unknown` заставляет вызывающую
   * сторону сузить его своим type-гардом. Адрес вне сетевой политики (`core/net.ts`) и
   * не-2xx ответ — исключение.
   */
  fetchJson(url: string): Promise<unknown>;

  /**
   * Загружает тело ответа как Blob, не больше `maxBytes`: при превышении загрузка
   * прерывается исключением. Адрес вне сетевой политики и не-2xx ответ — тоже исключение.
   */
  fetchBlob(url: string, maxBytes: number): Promise<Blob>;
};

/**
 * Хранилище настроек пользователя.
 */
export type HostSettings = {
  /**
   * Настройки пользователя; отсутствующие поля заполнены значениями по умолчанию.
   */
  getSettings(): Promise<Settings>;

  /**
   * Сохраняет переданные поля настроек, остальные не трогает.
   */
  setSettings(patch: Partial<Settings>): Promise<void>;
};

/**
 * Окружение, в котором работает ядро: сеть и настройки подключает само окружение, ядро
 * знает только контракты `HostNetwork` и `HostSettings`.
 *
 * Расширение: сеть через service worker (обход CORS), настройки в chrome.storage.
 * Userscript: сеть и настройки — адаптеры `src/userscript/`, выбранные по возможностям
 * менеджера userscript-ов.
 */
export type Host = {
  /**
   * Вид окружения — для диагностики в консоли.
   */
  name: 'extension' | 'userscript';
} & HostNetwork &
  HostSettings;
