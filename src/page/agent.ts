import {
  PAGE_FILE_ATTR,
  PAGE_REQUEST_EVENT,
  PAGE_RESPONSE_EVENT,
  PAGE_TARGET_ATTR,
  parsePageRequest,
  toPageEvent,
} from '../shared/pageBridge';
import type { PageRejectReason, PageResponse } from '../shared/pageBridge.types';

import type { AgentDocument, AgentNode } from './agent.types';
import { buildMessage } from './buildMessage';
import { fieldOf } from './field';
import { findClient } from './findClient';

const SEND_REQUEST_TYPE = 'sendNewMessages';

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
 * Исход загрузки amo показывает сам — неотправленным сообщением с повтором; агенту остаётся
 * оставить след в консоли для разработчика.
 *
 * @param sending — промис `sendRequest`
 */
const logOutcome = async (sending: Promise<unknown>) => {
  try {
    const result = await sending;

    if (result instanceof Error) {
      console.warn('[amo-stickers] amo rejected sticker send:', result.message);
    }
  } catch (error) {
    console.warn('[amo-stickers] sticker send failed:', error);
  }
};

/**
 * Ответ уходит синхронно, до возврата из `dispatchEvent` ядра: вся работа до вызова
 * `sendRequest` синхронная, а канал amo принимает запрос сразу, до своего первого `await`.
 *
 * @param doc — документ страницы
 * @param event — команда ядра
 */
const handleRequest = (doc: AgentDocument, event: Event) => {
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

  const built = buildMessage(client.reduxStore.getState(), file, Date.now(), Math.random);

  if ('reason' in built) return reject(built.reason);

  let sending: Promise<unknown>;

  try {
    sending = client.sendRequest({
      type: SEND_REQUEST_TYPE,
      payload: { messages: [built.message] },
    });
  } catch (error) {
    console.warn('[amo-stickers] sendRequest threw:', error);

    return reject('send-threw');
  }

  respond({ id, status: 'accepted' });
  void logOutcome(sending);
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

  host.__amoStickersPage = true;
  doc.addEventListener(PAGE_REQUEST_EVENT, (event) => {
    handleRequest(doc, event);
  });
};
