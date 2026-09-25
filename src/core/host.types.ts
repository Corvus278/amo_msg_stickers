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
 * Окружение, в котором работает ядро.
 *
 * Расширение: сеть через service worker (обход CORS), настройки в chrome.storage.
 * Userscript: прямой fetch со страницы, настройки в localStorage.
 */
export type Host = {
  /**
   * Вид окружения — для диагностики в консоли.
   */
  name: 'extension' | 'userscript';

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

  /**
   * Настройки пользователя; отсутствующие поля заполнены значениями по умолчанию.
   */
  getSettings(): Promise<Settings>;

  /**
   * Сохраняет переданные поля настроек, остальные не трогает.
   */
  setSettings(patch: Partial<Settings>): Promise<void>;
};
