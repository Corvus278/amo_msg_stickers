import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { startAgent } from '../src/page/agent';
import type { AmoRequest } from '../src/page/amo.types';
import {
  PAGE_FILE_ATTR,
  PAGE_REQUEST_EVENT,
  PAGE_RESPONSE_EVENT,
  PAGE_TARGET_ATTR,
  parsePageResponse,
} from '../src/shared/pageBridge';

import { FakeDocument, FakeElement } from './helpers/fakeDocument';
import { fiberChain, nodeWithFiber } from './helpers/fakeFiber';
import { makeGif } from './helpers/makeGif';

const CHAT_ID = 'chat-1';
const DRAFT_TEXT = 'привет, это черновик';

const REPLY_ID = 'msg-1';

const amoState = () => {
  return {
    location: { type: 'conversation', payload: { selectedConversationId: CHAT_ID } },
    dialogs: { [CHAT_ID]: { id: CHAT_ID, conversationType: 'chat' } },
  };
};

/**
 * Состояние с активным ответом; `refersTo: null` — store уже снял ответ.
 */
const replyState = (refersTo: string | null = REPLY_ID) => {
  return {
    ...amoState(),
    conversationDraughts: { [CHAT_ID]: { id: CHAT_ID, refersTo, value: DRAFT_TEXT } },
    messages: {
      [REPLY_ID]: { id: REPLY_ID, conversationId: CHAT_ID, conversationType: 'chat' },
    },
  };
};

const CLEAR_REQUEST = {
  type: 'updateConversationDraughtRefersToId',
  payload: { conversationId: CHAT_ID, refersToId: null },
};

const requestTypes = (sendRequest: Mock<(request: AmoRequest) => Promise<unknown>>) => {
  return sendRequest.mock.calls.map(([request]) => {
    return request.type;
  });
};

/**
 * Макрозадача, а не пара микрозадач: исход снятия проходит через несколько `await`.
 */
const flush = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

type Setup = {
  /**
   * Подменить провайдер amo на поле ввода; undefined — рабочий провайдер.
   */
  client?: unknown;

  /**
   * Файлы в `<input>`; undefined — один GIF.
   */
  files?: unknown[];

  /**
   * Состояние store amo; undefined — открыт групповой чат.
   */
  state?: unknown;
};

const setup = (options: Setup = {}) => {
  const sendRequest = vi.fn(async (_request: AmoRequest): Promise<unknown> => {
    return undefined;
  });
  let current: unknown = amoState();

  const state = () => {
    return current;
  };

  const setState = (next: unknown) => {
    current = next;
  };

  const client =
    'client' in options
      ? options.client
      : {
          sendRequest,
          reduxStore: {
            getState: () => {
              return 'state' in options ? options.state : state();
            },
          },
        };
  const { leaf } = fiberChain(3, { value: client });
  const target = new FakeElement({ ...nodeWithFiber(leaf), textContent: DRAFT_TEXT });
  const file = new File([makeGif(8, 8)], 'a.amostk.k-sticker.gif', {
    type: 'image/gif',
  });
  const input = new FakeElement({ files: options.files || [file] });
  const doc = new FakeDocument([target, input]);
  const host: Pick<Window, '__amoStickersPage'> = {};
  const responses: unknown[] = [];
  const rawDetails: unknown[] = [];

  doc.addEventListener(PAGE_RESPONSE_EVENT, (event) => {
    rawDetails.push('detail' in event ? event.detail : null);
    responses.push(parsePageResponse(event));
  });
  startAgent(doc, host);

  const send = (id = 'cmd-1', detail?: string) => {
    target.setAttribute(PAGE_TARGET_ATTR, id);
    input.setAttribute(PAGE_FILE_ATTR, id);
    doc.dispatchEvent(
      new CustomEvent(PAGE_REQUEST_EVENT, {
        detail: detail === undefined ? JSON.stringify({ id, op: 'send' }) : detail,
      })
    );
  };

  return {
    doc,
    file,
    host,
    input,
    rawDetails,
    responses,
    send,
    sendRequest,
    setState,
    target,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

const noop = () => {
  return undefined;
};

describe('startAgent', () => {
  it('отправляет файл в открытый чат и отвечает accepted синхронно', () => {
    const { file, responses, send, sendRequest } = setup();

    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'accepted' }]);
    expect(sendRequest).toHaveBeenCalledTimes(1);

    expect(sendRequest).toHaveBeenCalledWith({
      type: 'sendNewMessages',
      payload: {
        messages: [
          expect.objectContaining({
            conversationId: CHAT_ID,
            media: expect.objectContaining({ file }),
          }),
        ],
      },
    });
  });

  it('в ответе на странице только id и статус, без текста поля', () => {
    const { rawDetails, send } = setup();

    send();

    expect(rawDetails).toEqual([JSON.stringify({ id: 'cmd-1', status: 'accepted' })]);
    expect(String(rawDetails[0])).not.toContain(DRAFT_TEXT);
  });

  it('rejected no-client, если у значения провайдера не та форма, — без sendRequest', () => {
    const sendRequest = vi.fn();
    const { responses, send } = setup({ client: { sendRequest } });

    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'rejected', reason: 'no-client' }]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it.each([
    ['no-file', { files: [] }],
    ['no-file', { files: ['не файл'] }],
    ['no-conversation', { state: { location: { type: 'settings' } } }],
  ] satisfies [string, Setup][])('rejected %s без sendRequest', (reason, options) => {
    const { responses, send, sendRequest } = setup(options);

    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'rejected', reason }]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('rejected no-target, если поле ввода не помечено этой командой', () => {
    const { doc, responses, sendRequest, target } = setup();

    target.setAttribute(PAGE_TARGET_ATTR, 'другая');
    doc.dispatchEvent(
      new CustomEvent(PAGE_REQUEST_EVENT, {
        detail: JSON.stringify({ id: 'cmd-1', op: 'send' }),
      })
    );

    expect(responses).toEqual([{ id: 'cmd-1', status: 'rejected', reason: 'no-target' }]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('rejected send-threw, если sendRequest бросил синхронно', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });

    const { responses, send } = setup({
      client: {
        sendRequest: () => {
          throw new Error('канал закрыт');
        },
        reduxStore: { getState: amoState },
      },
    });

    send();

    expect(responses).toEqual([
      { id: 'cmd-1', status: 'rejected', reason: 'send-threw' },
    ]);
  });

  it('rejected build-threw, если состояние amo не читается, — без sendRequest', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });

    const sendRequest = vi.fn();
    const { responses, send } = setup({
      client: {
        sendRequest,
        reduxStore: {
          getState: () => {
            throw new Error('store detached');
          },
        },
      },
    });

    send();

    expect(responses).toEqual([
      { id: 'cmd-1', status: 'rejected', reason: 'build-threw' },
    ]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it.each([
    ['неизвестная операция', JSON.stringify({ id: 'cmd-1', op: 'stash' })],
    ['не JSON', '{'],
  ])('невалидная команда (%s) — без ответа и без отправки', (_case, detail) => {
    const { responses, send, sendRequest } = setup();

    send('cmd-1', detail);

    expect(responses).toEqual([]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('id со спецсимволами селектора не ломает поиск узлов', () => {
    const { responses, send, sendRequest } = setup();

    send('"] *');

    expect(responses).toEqual([{ id: '"] *', status: 'accepted' }]);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('второй запуск на той же странице не заводит второго слушателя', () => {
    const { doc, host, responses, send, sendRequest } = setup();

    startAgent(doc, host);
    send();

    expect(responses).toHaveLength(1);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('пишет в консоль, если amo вернул ошибку отправки', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });
    const { send, sendRequest } = setup();

    sendRequest.mockResolvedValueOnce(new Error('aborted on signOut'));
    send();
    await Promise.resolve();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledWith(
      '[amo-stickers] amo rejected sticker send:',
      'aborted on signOut'
    );
  });
});

describe('startAgent: ответ на сообщение', () => {
  it('отправляет стикер ответом и снимает ответ после отправки, accepted синхронно', () => {
    const { responses, send, sendRequest, setState } = setup();

    setState(replyState());
    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'accepted' }]);
    expect(requestTypes(sendRequest)).toEqual([
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
    ]);
    expect(sendRequest).toHaveBeenNthCalledWith(1, {
      type: 'sendNewMessages',
      payload: {
        messages: [
          expect.objectContaining({
            refersTo: expect.objectContaining({ id: REPLY_ID }),
          }),
        ],
      },
    });
    expect(sendRequest).toHaveBeenNthCalledWith(2, CLEAR_REQUEST);
  });

  it.each([
    ['без ответа', amoState()],
    ['сообщение ответа не загружено', { ...replyState(), messages: {} }],
  ])('%s — один запрос, без снятия', (_case, state) => {
    const { responses, send, sendRequest, setState } = setup();

    setState(state);
    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'accepted' }]);
    expect(requestTypes(sendRequest)).toEqual(['sendNewMessages']);
  });

  it('в ответе на странице только id и статус, без сообщения ответа', () => {
    const { rawDetails, send, setState } = setup();

    setState(replyState());
    send();

    expect(rawDetails).toEqual([JSON.stringify({ id: 'cmd-1', status: 'accepted' })]);
  });

  it('снятие бросило — accepted, стикер отправлен один раз', () => {
    vi.spyOn(console, 'warn').mockImplementation(noop);

    const { responses, send, sendRequest, setState } = setup();

    sendRequest.mockImplementation(async (request) => {
      if (request.type === CLEAR_REQUEST.type) throw new Error('не дошло');

      return undefined;
    });
    setState(replyState());
    send();

    expect(responses).toEqual([{ id: 'cmd-1', status: 'accepted' }]);
    expect(requestTypes(sendRequest)).toEqual([
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
    ]);
  });

  it('отправка бросила — rejected send-threw, ответ не снимается', () => {
    vi.spyOn(console, 'warn').mockImplementation(noop);

    const { responses, send, sendRequest, setState } = setup();

    sendRequest.mockImplementation(() => {
      throw new Error('канал закрыт');
    });
    setState(replyState());
    send();

    expect(responses).toEqual([
      { id: 'cmd-1', status: 'rejected', reason: 'send-threw' },
    ]);
    expect(requestTypes(sendRequest)).toEqual(['sendNewMessages']);
  });

  it('второй стикер, пока store показывает тот же ответ, — без цитаты и без второго снятия', () => {
    const { send, sendRequest, setState } = setup();

    setState(replyState());
    send('cmd-1');
    send('cmd-2');

    expect(requestTypes(sendRequest)).toEqual([
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
      'sendNewMessages',
    ]);
    expect(sendRequest.mock.calls[2]?.[0]).toEqual({
      type: 'sendNewMessages',
      payload: {
        messages: [expect.not.objectContaining({ refersTo: expect.anything() })],
      },
    });
  });

  it('после завершения снятия новый ответ на то же сообщение уходит с цитатой', async () => {
    const { send, sendRequest, setState } = setup();

    setState(replyState());
    send('cmd-1');
    await flush();
    send('cmd-2');

    expect(requestTypes(sendRequest)).toEqual([
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
    ]);
  });

  it.each([
    [
      'бросило',
      () => {
        throw new Error('не дошло');
      },
    ],
    [
      'отказ промиса',
      async () => {
        throw new Error('aborted');
      },
    ],
    [
      'Error в результате',
      async () => {
        return new Error('aborted on signOut');
      },
    ],
  ])('снятие не удалось (%s) — следующий стикер снова ответом', async (_case, clear) => {
    vi.spyOn(console, 'warn').mockImplementation(noop);

    const { send, sendRequest, setState } = setup();

    sendRequest.mockImplementation(async (request) => {
      return request.type === CLEAR_REQUEST.type ? clear() : undefined;
    });
    setState(replyState());
    send('cmd-1');
    await flush();
    send('cmd-2');

    expect(requestTypes(sendRequest)).toEqual([
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
      'sendNewMessages',
      'updateConversationDraughtRefersToId',
    ]);
  });
});
