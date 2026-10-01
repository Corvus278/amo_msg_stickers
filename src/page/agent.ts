import {
  PAGE_FILE_ATTR,
  PAGE_REQUEST_EVENT,
  PAGE_RESPONSE_EVENT,
  PAGE_TARGET_ATTR,
  parsePageRequest,
  toPageEvent,
} from '../shared/pageBridge';
import type { PageRejectReason, PageResponse } from '../shared/pageBridge.types';

import type {
  AgentDocument,
  AgentMemory,
  AgentNode,
  PreparedMessage,
} from './agent.types';
import type { AmoClient } from './amo.types';
import { buildMessage } from './buildMessage';
import { fieldOf } from './field';
import { findClient } from './findClient';
import { attachReply } from './refersTo';
import type { AmoReplyRef } from './refersTo.types';

const SEND_REQUEST_TYPE = 'sendNewMessages';

/**
 * Запрос, которым кнопка «×» над полем ввода снимает ответ.
 */
const CLEAR_REPLY_REQUEST_TYPE = 'updateConversationDraughtRefersToId';

/**
 * Узел ищется по имени атрибута, а значение сравнивается строкой: `id` команды приходит от
 * кого угодно на странице и в CSS-селектор не подставляется.
 *
 * @param doc — документ страницы
 * @param attr — атрибут пометки
 * @param id — `id` команды
 * @returns помеченный этой командой узел или null
 */
const markedNode = (doc: AgentDocument, attr: string, id: string): AgentNode | null => {
  for (const node of doc.querySelectorAll(`[${attr}]`)) {
    if (node.getAttribute(attr) === id) return node;
  }

  return null;
};

const fileOf = (input: AgentNode | null) => {
  const file = fieldOf(fieldOf(input, 'files'), '0');

  return file instanceof File ? file : null;
};

/**
 * Исход запроса amo показывает сам — неотправленным сообщением с повтором или оставшейся
 * плашкой ответа; агенту остаётся оставить след в консоли для разработчика.
 *
 * @param pending — промис `sendRequest`
 * @param what — что делал запрос, для консоли
 */
const logOutcome = async (pending: Promise<unknown>, what: string) => {
  try {
    const result = await pending;

    if (result instanceof Error) {
      console.warn(`[amo-stickers] amo rejected ${what}:`, result.message);
    }
  } catch (error) {
    console.warn(`[amo-stickers] ${what} failed:`, error);
  }
};

/**
 * Снятие ответа — после постановки стикера в очередь: стикер уже ушёл, и никакой исход
 * снятия не должен вести ко второй отправке. Снимаемый ответ агент помнит, пока запрос
 * снятия не завершился: после этого плашки нет, и новый ответ на то же сообщение — новый
 * выбор пользователя, а если снятие не удалось, плашка осталась, и следующий стикер, как
 * картинка из поля, уйдёт ответом.
 *
 * @param client — `{ reduxStore, sendRequest }` amo
 * @param reply — снимаемый ответ
 * @param memory — память агента о снимаемом ответе
 */
const clearReply = (client: AmoClient, reply: AmoReplyRef, memory: AgentMemory) => {
  const forget = () => {
    if (memory.pendingClear === reply) memory.pendingClear = null;
  };

  const forgetWhenSettled = async (request: Promise<unknown>) => {
    await logOutcome(request, 'reply clear');
    forget();
  };

  memory.pendingClear = reply;

  try {
    void forgetWhenSettled(
      client.sendRequest({
        type: CLEAR_REPLY_REQUEST_TYPE,
        payload: { conversationId: reply.conversationId, refersToId: null },
      })
    );
  } catch (error) {
    console.warn('[amo-stickers] reply clear threw:', error);
    forget();
  }
};

/**
 * Ответ уходит синхронно, до возврата из `dispatchEvent` ядра: вся работа до вызова
 * `sendRequest` синхронная, а исход очереди не ждём — `accepted` значит «`sendRequest` не
 * бросил», дальнейшее показывает сама amo (design.md, п. 6).
 *
 * @param doc — документ страницы
 * @param event — команда ядра
 * @param memory — память агента между командами
 */
const handleRequest = (doc: AgentDocument, event: Event, memory: AgentMemory) => {
  const request = parsePageRequest(event);

  if (!request) return;

  const { id } = request;

  const respond = (response: PageResponse) => {
    doc.dispatchEvent(toPageEvent(PAGE_RESPONSE_EVENT, response));
  };

  const reject = (reason: PageRejectReason) => {
    respond({ id, status: 'rejected', reason });
  };

  const target = markedNode(doc, PAGE_TARGET_ATTR, id);

  if (!target) return reject('no-target');

  const file = fileOf(markedNode(doc, PAGE_FILE_ATTR, id));

  if (!file) return reject('no-file');

  const client = findClient(target);

  if (!client) return reject('no-client');

  /**
   * `getState` и чтение состояния — чужой код: исключение в них — отказ с причиной, а не
   * молчание, которое ядро приняло бы за отсутствие агента.
   */
  let prepared: PreparedMessage;

  try {
    const state = client.reduxStore.getState();
    const built = buildMessage(state, file, Date.now(), Math.random);

    prepared =
      'reason' in built ? built : attachReply(state, built.message, memory.pendingClear);
  } catch (error) {
    console.warn('[amo-stickers] amo state unreadable:', error);

    return reject('build-threw');
  }

  if ('reason' in prepared) return reject(prepared.reason);

  const { message, replyToClear, pendingClear } = prepared;

  memory.pendingClear = pendingClear;

  let sending: Promise<unknown>;

  try {
    sending = client.sendRequest({
      type: SEND_REQUEST_TYPE,
      payload: { messages: [message] },
    });
  } catch (error) {
    console.warn('[amo-stickers] sendRequest threw:', error);

    return reject('send-threw');
  }

  void logOutcome(sending, 'sticker send');

  if (replyToClear) clearReply(client, replyToClear, memory);

  respond({ id, status: 'accepted' });
};

/**
 * Запускает агента в мире страницы. Повторный запуск на той же странице — расширение и
 * userscript вместе или двойное подключение — ничего не делает: второй слушатель отправил
 * бы стикер дважды.
 *
 * @param doc — документ страницы
 * @param host — `window` страницы, на нём флаг запуска
 */
export const startAgent = (
  doc: AgentDocument,
  host: Pick<Window, '__amoStickersPage'>
) => {
  if (host.__amoStickersPage) return;

  const memory: AgentMemory = { pendingClear: null };

  host.__amoStickersPage = true;
  doc.addEventListener(PAGE_REQUEST_EVENT, (event) => {
    handleRequest(doc, event, memory);
  });
};
