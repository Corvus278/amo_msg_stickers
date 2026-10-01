import { isObject } from '../shared/guards';

import type { AmoStickerMessage } from './buildMessage.types';
import { fieldOf } from './field';
import type {
  AmoQuotedMessage,
  AmoReplyRef,
  AttachedReply,
  ReplyLookup,
} from './refersTo.types';
import { isQuotedMessage } from './refersTo.types';

/**
 * Ответ стикером повторяет то, что страница amo кладёт в очередь при ответе картинкой из
 * поля ввода: в `refersTo` — объект сообщения, на которое отвечают.
 */

/**
 * Бит пересланного сообщения в `flags[0]`.
 */
const FLAG_FORWARDED = 128;

/**
 * Снятие ответа доходит до store не сразу, и стикер, отправленный в это окно, прочитал бы
 * тот же ответ — вторую цитату того же сообщения. Ответ, который агент уже снимает,
 * пропускается, пока черновик показывает его же; другой ответ или его отсутствие значит,
 * что store догнал, и помнить больше нечего.
 *
 * @param state — состояние store amo
 * @param conversationId — id открытого чата
 * @param pendingClear — ответ, снятие которого ещё идёт; null — не идёт
 * @returns ответ для стикера и что помнить дальше
 */
export const draughtReplyOf = (
  state: unknown,
  conversationId: string,
  pendingClear: AmoReplyRef | null
): ReplyLookup => {
  const draught = fieldOf(fieldOf(state, 'conversationDraughts'), conversationId);
  const refersTo = fieldOf(draught, 'refersTo');
  const replyId = typeof refersTo === 'string' && refersTo ? refersTo : null;

  if (
    replyId &&
    pendingClear?.conversationId === conversationId &&
    pendingClear.messageId === replyId
  ) {
    return { replyId: null, pendingClear };
  }

  return { replyId, pendingClear: null };
};

/**
 * Пересланное сообщение цитируется содержимым исходного под `id`, чатом и адресатом
 * пересланного и без флага пересылки — так, как его цитирует картинка из поля ввода.
 * Пересланное без вложенного сообщения цитируется как есть.
 *
 * @param state — состояние store amo
 * @param replyId — id сообщения, на которое отвечают
 * @returns сообщение для `refersTo`; null — страница его не загрузила или форма чужая
 */
export const quotedMessageOf = (
  state: unknown,
  replyId: string
): AmoQuotedMessage | null => {
  const message = fieldOf(fieldOf(state, 'messages'), replyId);

  if (!isQuotedMessage(message, replyId)) return null;

  const flag = fieldOf(fieldOf(message, 'flags'), '0');
  const original = fieldOf(message, 'refersTo');

  if (typeof flag !== 'number' || !(flag & FLAG_FORWARDED) || !isObject(original)) {
    return message;
  }

  const { id, conversationId, conversationType } = message;

  return {
    ...original,
    flags: [flag & ~FLAG_FORWARDED],
    id,
    conversationId,
    conversationType,
    toMember: fieldOf(message, 'toMember'),
    to: fieldOf(message, 'to'),
  };
};

/**
 * Ответ, чьё сообщение страница не загрузила, не снимается: стикер уходит без цитаты, а
 * плашка остаётся, чтобы ответ не пропал молча.
 *
 * @param state — состояние store amo
 * @param message — собранное сообщение стикера
 * @param pendingClear — ответ, снятие которого ещё идёт; null — не идёт
 * @returns сообщение с ответом из черновика его чата, что снять и что помнить дальше
 */
export const attachReply = (
  state: unknown,
  message: AmoStickerMessage,
  pendingClear: AmoReplyRef | null
): AttachedReply => {
  const { conversationId } = message;
  const lookup = draughtReplyOf(state, conversationId, pendingClear);
  const quoted = lookup.replyId ? quotedMessageOf(state, lookup.replyId) : null;

  if (!quoted) {
    return { message, replyToClear: null, pendingClear: lookup.pendingClear };
  }

  return {
    message: { ...message, refersTo: quoted },
    replyToClear: { conversationId, messageId: quoted.id },
    pendingClear: lookup.pendingClear,
  };
};
