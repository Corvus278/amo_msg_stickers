/**
 * Срез внутренностей amo web, на который опирается агент. Это не API: форма сверена по
 * исходникам amo (ссылки — `openspec/changes/send-via-amo-queue/design.md`) и проверяется
 * гардами на каждой отправке.
 */

/**
 * Запрос в канал контроллеров amo.
 */
export type AmoRequest = {
  /**
   * Тип запроса, например `sendNewMessages`.
   */
  type: string;

  /**
   * Данные запроса.
   */
  payload: unknown;
};

/**
 * Значение `ReactClientContext.Provider` amo — один объект на страницу.
 */
export type AmoClient = {
  /**
   * Кладёт запрос в канал контроллеров; резолвится по концу его обработки.
   */
  sendRequest: (request: AmoRequest) => Promise<unknown>;

  /**
   * Redux store amo.
   */
  reduxStore: {
    /**
     * Текущее состояние store.
     */
    getState: () => unknown;
  };
};
