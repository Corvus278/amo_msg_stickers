export type MockResponseInit = {
  /**
   * Итоговый адрес после редиректов. Пустая строка — как у ответа без адреса.
   */
  url?: string;

  /**
   * HTTP-статус ответа.
   */
  status?: number;

  /**
   * Заголовки ответа.
   */
  headers?: Record<string, string>;
};
