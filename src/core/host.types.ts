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
   * Загружает JSON по адресу. Форму ответа не проверяет: `T` — обещание вызывающей стороны.
   * Не-2xx ответ — исключение с HTTP-статусом.
   */
  fetchJson<T>(url: string): Promise<T>;

  /**
   * Загружает тело ответа как Blob. Не-2xx ответ — исключение с HTTP-статусом.
   */
  fetchBlob(url: string): Promise<Blob>;

  /**
   * Настройки пользователя; отсутствующие поля заполнены значениями по умолчанию.
   */
  getSettings(): Promise<Settings>;

  /**
   * Сохраняет переданные поля настроек, остальные не трогает.
   */
  setSettings(patch: Partial<Settings>): Promise<void>;
};
