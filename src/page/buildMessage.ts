import type {
  AmoConversation,
  AmoStickerMessage,
  BuildMessageResult,
} from './buildMessage.types';
import { fieldOf } from './field';

/**
 * Сообщение собирается так же, как его собирает `buildRegularMessages` amo для опроса и
 * пересылки: тогда очередь `sendNewMessages` принимает его наравне со своими. Поле ввода,
 * черновик и активный ответ amo при этом не участвуют.
 */

const ROUTE_CONVERSATION = 'conversation';

/**
 * Типы, которые знает `mapRequestPeer` amo: для остальных запрос не соберётся.
 */
const SUPPORTED_CONVERSATION_TYPES = new Set([
  'user',
  'bot',
  'chat',
  'lead',
  'request',
  'client',
  'folder',
]);

/**
 * Node uuid v1 — как у amo (`0123456789ab`). amo читает из id только время, node — для
 * единообразия с его собственными id, а не часть контракта.
 */
const UUID_NODE = '0123456789ab';

/**
 * Сдвиг от эпохи григорианского календаря (начало отсчёта uuid v1) до Unix, в сотнях нс.
 */
const GREGORIAN_OFFSET = 122_192_928_000_000_000n;

const TICKS_PER_MS = 10_000n;

/**
 * Поля uuid v1 по RFC 4122: версия 1 — в старших битах `time_hi`, clock sequence — 14
 * случайных бит с вариантом `10` в двух старших.
 */
const UUID_VERSION_1 = 0x10_00n;
const TIME_HIGH_MASK = 0x0f_ffn;
const CLOCK_SEQ_RANGE = 0x40_00;
const UUID_VARIANT_RFC4122 = 0x80_00;

/**
 * Время в id — `now`, а младшие сотни наносекунд и clock sequence случайные: два стикера в
 * одну миллисекунду не совпадут. Разбор времени — как `uuidv1.timestamp` amo.
 *
 * @param now — время, мс
 * @param random — источник случайности [0, 1)
 * @returns uuid v1
 */
const uuidV1 = (now: number, random: () => number) => {
  const ticks =
    BigInt(now) * TICKS_PER_MS +
    GREGORIAN_OFFSET +
    BigInt(Math.floor(random() * Number(TICKS_PER_MS)));

  const hex = (value: bigint | number, length: number) => {
    return value.toString(16).padStart(length, '0');
  };

  const timeLow = hex(ticks & 0xff_ff_ff_ffn, 8);
  const timeMid = hex((ticks >> 32n) & 0xff_ffn, 4);
  const timeHigh = hex(((ticks >> 48n) & TIME_HIGH_MASK) | UUID_VERSION_1, 4);
  const clockSeq = hex(Math.floor(random() * CLOCK_SEQ_RANGE) | UUID_VARIANT_RFC4122, 4);

  return `${timeLow}-${timeMid}-${timeHigh}-${clockSeq}-${UUID_NODE}`;
};

/**
 * Открытый чат берётся из адреса, а тип пира — из `state.dialogs`, а не из адреса: в адресе
 * другой набор (`direct` у чата типа `user`).
 *
 * @param state — состояние store amo
 * @returns чат; null — открыт не чат, его нет в `dialogs` или у записи нет типа пира
 */
const conversationOf = (state: unknown): AmoConversation | null => {
  const location = fieldOf(state, 'location');
  const id = fieldOf(fieldOf(location, 'payload'), 'selectedConversationId');

  if (fieldOf(location, 'type') !== ROUTE_CONVERSATION || typeof id !== 'string' || !id) {
    return null;
  }

  const dialog = fieldOf(fieldOf(state, 'dialogs'), id);

  if (!dialog) return null;

  const type = fieldOf(dialog, 'conversationType');

  return typeof type === 'string' && type ? { id, type } : null;
};

/**
 * @param state — состояние store amo
 * @param file — GIF, который уйдёт как есть
 * @param now — время, мс
 * @param random — источник случайности [0, 1)
 * @returns сообщение для `sendNewMessages` или причина, по которой его не собрать
 */
export const buildMessage = (
  state: unknown,
  file: File,
  now: number,
  random: () => number
): BuildMessageResult => {
  const conversation = conversationOf(state);

  if (!conversation) return { reason: 'no-conversation' };

  if (!SUPPORTED_CONVERSATION_TYPES.has(conversation.type)) {
    return { reason: 'unsupported-conversation' };
  }

  const id = uuidV1(now, random);

  /**
   * Id медиа amo не разбирает — это только ключ файла в очереди отправки, — поэтому он
   * производный от id сообщения, а не копия `generateMediaId` amo.
   */
  const mediaId = `amostk-${id}`;
  const message: AmoStickerMessage = {
    conversationId: conversation.id,
    conversationType: conversation.type,
    flags: [2],
    from: { memberSelf: {} },
    to: { memberAll: {} },
    fromMember: { memberId: '', memberType: 'self' },
    toMember: { memberId: '', memberType: 'all' },
    message: '',
    id,
    idempotencyKey: id,
    date: now,
    media: {
      id: mediaId,
      isLocal: true,
      fileName: file.name,
      localPhotoSize: { localFileId: mediaId, size: file.size },
      uploadedFileId: null,
      localFlag: 1,
      mediaType: 'photo',
      file,
    },
    sending: true,
    isLocal: true,
    type: 'regular',
  };

  /**
   * Ключ `<тип пира>: <id чата>` amo тоже читает у сообщения — `buildRegularMessages`
   * кладёт его первым.
   */
  return { message: { [conversation.type]: conversation.id, ...message } };
};
