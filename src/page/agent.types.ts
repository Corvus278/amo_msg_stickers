import type { BuildMessageFailure } from './buildMessage.types';
import type { AmoReplyRef, AttachedReply } from './refersTo.types';

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

/**
 * Что агент помнит между командами.
 */
export type AgentMemory = {
  /**
   * Ответ, снятие которого ещё идёт: пока черновик в store показывает его же, стикер уходит без
   * цитаты; null — снятие не идёт.
   */
  pendingClear: AmoReplyRef | null;
};

/**
 * Итог подготовки команды: сообщение с ответом из черновика или причина, по которой его не
 * собрать.
 */
export type PreparedMessage = AttachedReply | BuildMessageFailure;
