/**
 * Узел DOM, как его читает агент: атрибут пометки и, у `<input>`, файлы.
 */
export type AgentNode = {
  /**
   * Значение атрибута; null — атрибута нет.
   */
  getAttribute: (name: string) => string | null;
};

/**
 * Срез `document`, который нужен агенту: события протокола и поиск помеченных узлов.
 */
export type AgentDocument = {
  /**
   * Подписка на команды ядра.
   */
  addEventListener: (type: string, listener: (event: Event) => void) => void;

  /**
   * Отправка ответа ядру.
   */
  dispatchEvent: (event: Event) => boolean;

  /**
   * Узлы с атрибутом пометки: `[<атрибут>]`.
   */
  querySelectorAll: (selector: string) => Iterable<AgentNode>;
};
