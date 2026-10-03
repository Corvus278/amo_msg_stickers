/**
 * Стабильная разметка amo web — атрибуты `data-compose-*`, `data-feed-*` и `data-photo-*`, которые
 * amo ставит как контракт для внешних скриптов (amo-messenger/web, спека `dom-markers`). Классы и
 * структура дерева здесь не используются: от правки вёрстки amo атрибуты не меняются.
 */

import type { AmoMarkup, Composer, ShownNode } from './amoDom.types';

/**
 * Корни поиска стабильной разметки. Прежняя разметка исключает узлы с ними
 * (`amoDomLegacy.ts`): классы и структура у новой amo те же, и без исключения одно поле и одно
 * сообщение нашлись бы обеими разметками.
 */
export const STABLE_COMPOSE_INPUT_ATTR = 'data-compose-input';
export const STABLE_MESSAGE_ATTR = 'data-feed-message';

const INPUT_SELECTOR = `[${STABLE_COMPOSE_INPUT_ATTR}]`;
const ROW_SELECTOR = '[data-compose-row]';
const EMOJI_SELECTOR = ':scope > [data-compose-emoji]';
const COMPOSE_SELECTOR = '[data-compose]';
const SEND_SELECTOR = '[data-compose-send]';
const CANCEL_EDIT_SELECTOR = '[data-compose-cancel-edit]';
const VISIBLE_ATTR = 'data-visible';

/**
 * Пересылка, в том числе в «Избранное», остаётся в пузыре: `data-forwarded` — её единственный
 * признак, у пересылки в «Избранное» нет ни заголовка «Forwarded from», ни признака на медиа.
 */
const MESSAGE = `[${STABLE_MESSAGE_ATTR}]:not([data-forwarded])`;

/**
 * Медиа без подписи и пересылки. `:only-child` отсекает футер с реакциями списком: он лежит в
 * обёртке содержимого рядом с медиа, и такое сообщение остаётся в пузыре.
 */
const MEDIA =
  '[data-feed-media="photo"]:only-child:not([data-forwarded]):not([data-with-text])';

/**
 * Наш контейнер картинки узнаётся по имени файла на нём самом: атрибут стоит и в заглушке, пока
 * `img` нет, и после загрузки, на одном элементе.
 */
const OUR_FRAME = '[data-photo-frame][data-file-name*="amostk."]';
const STICKER_FRAME = `${OUR_FRAME}[data-file-name*=".k-sticker."]`;

/**
 * Содержимое пузыря с нашей картинкой, от обёртки содержимого до контейнера картинки.
 */
const OUR_CONTENT = `[data-feed-content] > ${MEDIA} > [data-feed-photo] > ${OUR_FRAME}`;
const STICKER_CONTENT = `[data-feed-content] > ${MEDIA} > [data-feed-photo] > ${STICKER_FRAME}`;

const ROW = `${MESSAGE} > [data-feed-row]`;
const BUBBLE = `${ROW} > [data-feed-bubble]:has(> ${OUR_CONTENT})`;
const PHOTO = `${BUBBLE} > [data-feed-content] > ${MEDIA} > [data-feed-photo]`;
const STICKER_FRAME_PATH = `${PHOTO} > ${STICKER_FRAME}`;

const REPLY_MESSAGE = `${MESSAGE}[data-with-reply]`;
const REPLY_BUBBLE = `${REPLY_MESSAGE} > [data-feed-row] > [data-feed-bubble]:has(> ${OUR_CONTENT})`;

/**
 * Плашка цитаты — цитата ответа прямо перед обёрткой содержимого с нашей картинкой.
 */
const QUOTE = `${REPLY_BUBBLE} > [data-feed-reply-quote]:has(+ ${OUR_CONTENT})`;

/**
 * Кнопка смонтирована всегда и прячется классами amo: видимость — только по маркеру.
 *
 * @param button — кнопка «Отправить» или отмены редактирования
 * @returns true — кнопка показана
 */
const isShown = (button: ShownNode) => {
  return button.hasAttribute(VISIBLE_ATTR);
};

const findComposers = (root: ParentNode): Composer[] => {
  const result: Composer[] = [];

  for (const editable of root.querySelectorAll<HTMLElement>(INPUT_SELECTOR)) {
    const row = editable.closest<HTMLElement>(ROW_SELECTOR);
    const emojiWrap = row?.querySelector<HTMLElement>(EMOJI_SELECTOR);

    if (!row || !emojiWrap) continue;
    const compose = row.closest<HTMLElement>(COMPOSE_SELECTOR);

    result.push({
      editable,
      row,
      emojiWrap,
      sendButton: compose?.querySelector<HTMLElement>(SEND_SELECTOR) || null,
      cancelEditButton: compose?.querySelector<HTMLElement>(CANCEL_EDIT_SELECTOR) || null,
      markup: stableMarkup,
    });
  }

  return result;
};

export const stableMarkup: AmoMarkup = {
  findComposers,
  isShown,
  message: {
    bubble: BUBBLE,
    tail: `${ROW}:has(> [data-feed-bubble] > ${OUR_CONTENT}) > [data-feed-bubble-tail]`,
    backdrop: `${PHOTO}:has(> ${OUR_FRAME}) > [data-photo-backdrop]`,
    author: `${BUBBLE} > [data-feed-author]`,
    image: `${PHOTO} > ${OUR_FRAME} > img`,
    stickerButton: `${PHOTO}:has(> ${STICKER_FRAME})`,
    stickerSizing: {
      by: 'frame',
      frame: STICKER_FRAME_PATH,
      placeholder: `${STICKER_FRAME_PATH} > [data-photo-placeholder]`,
    },
    quote: QUOTE,
    stickerQuote: `${QUOTE}:has(+ ${STICKER_CONTENT})`,
    gifQuote: `${QUOTE}:not(:has(+ ${STICKER_CONTENT}))`,
    replyRow: `${REPLY_MESSAGE} > [data-feed-row]:has(> [data-feed-bubble] > ${OUR_CONTENT})`,
    replyControls: `${REPLY_BUBBLE} > [data-feed-controls]`,
    outgoing: '[data-outgoing]',
    withAvatar: '[data-with-author]:not([data-outgoing])',
  },
};
