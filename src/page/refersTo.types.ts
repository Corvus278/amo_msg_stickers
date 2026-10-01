import { isObject } from '../shared/guards';

import type { AmoStickerMessage } from './buildMessage.types';

/**
 * Сообщение, на которое отвечает стикер, — в поле `refersTo` сообщения очереди. Проверены
 * только поля, по которым сервер связывает ответ; остальное нужно временному сообщению в
 * ленте, чтобы цитата была видна до ответа сервера, и уходит как есть.
 */
export type AmoQuotedMessage = {
  /**
   * Id сообщения — ключ в `state.messages`.
   */
  id: string;

  /**
   * Id чата сообщения.
   */
  conversationId: string;

  /**
   * Тип пира чата сообщения.
   */
  conversationType: string;

  /**
   * Остальные поля сообщения из состояния amo.
   */
  [field: string]: unknown;
};

/**
 * Ответ в черновике чата: на какое сообщение и в каком чате.
 */
export type AmoReplyRef = {
  /**
   * Id чата, в черновике которого ответ.
   */
  conversationId: string;

  /**
   * Id сообщения, на которое отвечают.
   */
  messageId: string;
};

/**
 * Активный ответ с учётом ответа, снятие которого ещё идёт.
 */
export type ReplyLookup = {
  /**
   * Id сообщения, на которое должен ответить стикер; null — без ответа.
   */
  replyId: string | null;

  /**
   * Ответ, снятие которого ещё идёт и который агенту помнить дальше; null — помнить нечего.
   */
  pendingClear: AmoReplyRef | null;
};

/**
 * Сообщение с ответом из черновика и что агенту делать с ответом дальше.
 */
export type AttachedReply = {
  /**
   * Сообщение для очереди — с `refersTo`, если ответ найден.
   */
  message: AmoStickerMessage;

  /**
   * Ответ, который стикер забрал из черновика и который после отправки надо снять; null —
   * стикер без ответа.
   */
  replyToClear: AmoReplyRef | null;

  /**
   * Ответ, снятие которого ещё идёт и который агенту помнить дальше; null — помнить нечего.
   */
  pendingClear: AmoReplyRef | null;
};

const isFilledString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * @param value — запись `state.messages`
 * @param id — id, под которым она лежит
 * @returns true, если это сообщение с этим id и с чатом
 */
export const isQuotedMessage = (
  value: unknown,
  id: string
): value is AmoQuotedMessage => {
  return (
    isObject(value) &&
    'id' in value &&
    value.id === id &&
    'conversationId' in value &&
    isFilledString(value.conversationId) &&
    'conversationType' in value &&
    isFilledString(value.conversationType)
  );
};
