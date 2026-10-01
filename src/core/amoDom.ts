/**
 * Всё знание о DOM amo web в одном месте.
 *
 * data-testid в amo нет: опираемся на aria-атрибуты и стабильные tailwind-классы.
 */

import type { Composer, SendComposer, ShownNode } from './amoDom.types';
import { BUBBLE_TOKENS } from './bubbleTokens';

const EDITABLE_SELECTOR = 'div[contenteditable="true"][aria-placeholder]';
const ROW_SELECTOR = 'div.flex.size-full';

/**
 * Корень блока ввода: содержит и кнопку отправки, и кнопку отмены редактирования.
 */
const COMPOSE_ROOT_SELECTOR = 'div.flex-nowrap';
const SEND_BUTTON_SELECTOR = '[aria-label="Send message"]';
const CANCEL_EDIT_SELECTOR = '[aria-label="cancel edit"]';

/**
 * Обёртку эмодзи узнаём по паре классов: других стабильных признаков у неё нет.
 */
const EMOJI_WRAP_CLASSES = ['z-100', 'w-4.5'];

const isEmojiWrap = (el: Element): el is HTMLElement => {
  return (
    el instanceof HTMLElement &&
    EMOJI_WRAP_CLASSES.every((className) => {
      return el.classList.contains(className);
    })
  );
};

export const findComposers = (root: ParentNode = document): Composer[] => {
  const result: Composer[] = [];

  for (const editable of root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR)) {
    const row = editable.closest<HTMLElement>(ROW_SELECTOR);

    if (!row) continue;
    const emojiWrap = Array.from(row.children).find(isEmojiWrap);

    if (!emojiWrap) continue;
    const composeRoot = row.closest<HTMLElement>(COMPOSE_ROOT_SELECTOR);

    result.push({
      editable,
      row,
      emojiWrap,
      sendButton: composeRoot?.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR) || null,
      cancelEditButton:
        composeRoot?.querySelector<HTMLElement>(CANCEL_EDIT_SELECTOR) || null,
    });
  }

  return result;
};

export const composerOf = (el: Element): Composer | null => {
  return (
    findComposers().find(({ row }) => {
      return row.contains(el);
    }) || null
  );
};

/**
 * Кнопки скрыты через size-0/opacity-0 и становятся видимыми с opacity-100.
 */
const isShown = (el: ShownNode | null) => {
  return Boolean(el?.classList.contains('opacity-100'));
};

export const isEditing = ({
  cancelEditButton,
}: Pick<SendComposer, 'cancelEditButton'>) => {
  return isShown(cancelEditButton);
};

/**
 * Кнопка «Отправить» видна, если есть текст или вложения.
 */
export const isDraftEmpty = ({ sendButton }: Pick<SendComposer, 'sendButton'>) => {
  return !isShown(sendButton);
};

export const isDarkTheme = () => {
  return document.documentElement.classList.contains('dark');
};

/**
 * Лимит стороны стикера в ленте — как у стикеров Telegram.
 */
const STICKER_MAX_SIDE_PX = 208;

const MESSAGE_STYLE_ID = 'amo-stickers-message';

/**
 * Классы CSS-модулей amo — `<имя>-<хэш>`, хэш меняется от сборки к сборке, поэтому
 * селекторы держатся за основу `[class*="<имя>-"]`, `id` корня сообщения, структуру и `alt`.
 *
 * Ответ нашей картинкой — тоже своё сообщение: картинка выглядит как без ответа, а цитата
 * выносится плашкой рядом с ней, как в Telegram (`QUOTE_SELECTOR`). У сообщения под заголовком
 * автора (`message_with_user-`, групповой чат и канал) скрывается строка имени.
 *
 * Исключён и заголовок, где имя — не кнопка, а простой `div`, как у пересылки в «Избранное». Там
 * у пересылки нет ни блока «Forwarded from», ни `forwarded-` на обёртке медиа, и заголовок с
 * именем — единственный её признак: без пузыря он повис бы над стикером.
 */
const MESSAGE_SELECTOR =
  '[id^="message+"]:not(:has(> div > div > div:first-child:not([class]) > div))';

/**
 * Обёртка медиа ленты. `:only-child` отсекает подпись и футер с реакциями, `forwarded-` —
 * пересылку, `media_wrapper_with_text-` — медиа с текстом: такие сообщения остаются в пузыре.
 */
const MEDIA_SELECTOR =
  '[class*="media_wrapper_photo-"]:only-child:not([class*="forwarded-"]):not([class*="media_wrapper_with_text-"])';

const MEDIA_CONTAINER_SELECTOR = '[class*="photo_media_container-"]';
const OUR_IMG_SELECTOR = 'img[alt*="amostk."]';
const STICKER_IMG_SELECTOR = `${OUR_IMG_SELECTOR}[alt*=".k-sticker."]`;

/**
 * Путь от корня сообщения до обёртки медиа: ряд → пузырь → обёртка содержимого → медиа.
 * Картинка с тем же `alt` в цитате ответа, пересылке, просмотрщике и превью лежит по
 * другому пути и не задевается.
 */
const MEDIA_PATH = `${MESSAGE_SELECTOR} > div > div > div > ${MEDIA_SELECTOR}`;

const IMG_SELECTOR = `${MEDIA_PATH} > ${MEDIA_CONTAINER_SELECTOR} > div > ${OUR_IMG_SELECTOR}`;
const BUBBLE_SELECTOR = `${MESSAGE_SELECTOR} > div > div:has(> div > ${MEDIA_SELECTOR} ${OUR_IMG_SELECTOR})`;
const TAIL_SELECTOR = `${MESSAGE_SELECTOR}:has(${MEDIA_SELECTOR} ${OUR_IMG_SELECTOR}) [class*="message_tail-"]`;
const BLUR_SELECTOR = `${MEDIA_PATH} > ${MEDIA_CONTAINER_SELECTOR}:has(${OUR_IMG_SELECTOR}) > div:has(> canvas)`;

/**
 * Строка имени автора — первый ребёнок пузыря с кнопкой имени; у сообщения без заголовка
 * первый ребёнок — обёртка содержимого, прямой кнопки в ней нет.
 */
const AUTHOR_SELECTOR = `${BUBBLE_SELECTOR} > div:first-child:has(> button)`;

/**
 * Пузырь ответа нашей картинкой — от него отсчитывается плашка цитаты: у пузыря amo уже
 * `position: relative`.
 */
const REPLY_BUBBLE_SELECTOR = `${MESSAGE_SELECTOR}[class*="message_with_reply-"] > div > div:has(> div > ${MEDIA_SELECTOR} ${OUR_IMG_SELECTOR})`;

/**
 * Плашка цитаты — блок пузыря прямо перед обёрткой содержимого с нашим медиа. Строка автора
 * лежит на том же месте у сообщения без ответа, но у неё кнопка имени — она не плашка.
 */
const QUOTE_SELECTOR = `${REPLY_BUBBLE_SELECTOR} > div:not(:has(> button)):has(+ div > ${MEDIA_SELECTOR})`;

/**
 * Плашка у стикера и у GIF считает место рядом по-разному: пузырь стикера не шире стикера с
 * отступами, а пузырь GIF — доля ряда.
 */
const STICKER_QUOTE_SELECTOR = `${QUOTE_SELECTOR}:has(+ div ${STICKER_IMG_SELECTOR})`;
const GIF_QUOTE_SELECTOR = `${QUOTE_SELECTOR}:not(:has(+ div ${STICKER_IMG_SELECTOR}))`;

/**
 * Панель действий amo при наведении — слева от исходящего пузыря и справа от входящего, по
 * верху: там же, где плашка.
 */
const REPLY_CONTROLS_SELECTOR = `${REPLY_BUBBLE_SELECTOR} > div:has(> [class*="message_controls-"])`;

/**
 * Ряд сообщения-ответа нашей картинкой — контейнер `REPLY_CONTAINER`: ширина плашки и переход
 * в узкий режим считаются от ширины ряда (`cqw`, container query). Остальные ряды ленты
 * контейнерами не становятся.
 */
const REPLY_ROW_SELECTOR = `${MESSAGE_SELECTOR}[class*="message_with_reply-"]:has(> div > div > div > ${MEDIA_SELECTOR} ${OUR_IMG_SELECTOR}) > div`;
const REPLY_CONTAINER = 'amostk-reply';

/**
 * Направление сообщения — класс на корне: у исходящего плашка слева от картинки, у входящего —
 * справа.
 */
const OUTGOING_SELECTOR = '[class*="is_outgoing-"]';

/**
 * Входящее под заголовком автора — в его ряду рядом с пузырём ещё и аватар.
 */
const WITH_AVATAR_SELECTOR = `[class*="message_with_user-"]:not(${OUTGOING_SELECTOR})`;

/**
 * Фон плашки — фон пузыря amo того же направления и темы: цвета текста цитаты amo подобраны под
 * него.
 */
const BUBBLE_BACKGROUND = {
  incoming: `linear-gradient(to top, ${BUBBLE_TOKENS['gray.110']}, ${BUBBLE_TOKENS['white.0']})`,
  incomingDark: BUBBLE_TOKENS['black.60'],
  outgoing: `linear-gradient(to top, ${BUBBLE_TOKENS['flowerBlue.20']}, ${BUBBLE_TOKENS['blue.120']})`,
  outgoingDark: BUBBLE_TOKENS['beige.80'],
};

/**
 * Скругление и тень пузыря amo — `rounded-lgx` и `shadow-md`.
 */
const BUBBLE_RADIUS = '10px';
const BUBBLE_SHADOW = '0 1px 0 rgba(0,0,0,0.15)';

/**
 * Плашка занимает свободное место ряда рядом с картинкой, но не шире 260 px; длинную цитату
 * обрезает сама amo. Уже 90 px цитата не читается — тогда плашка встаёт над картинкой.
 */
const QUOTE_MAX_WIDTH_PX = 260;
const QUOTE_MIN_WIDTH_PX = 90;

/**
 * Картинка в пузыре сдвинута от его края на `p-2` минус выход обёртки медиа за отступ
 * (`-m-1`): плашка отсчитывается от того же места, чтобы её верх совпал с верхом картинки, а
 * между ними было 10 px.
 */
const MEDIA_INSET_PX = 4;
const QUOTE_GAP_PX = 10 - MEDIA_INSET_PX;

/**
 * Что ещё занимает ряд рядом с пузырём: слот чекбокса выбора сообщений (`size-5`) у края ряда
 * и, у входящего под заголовком автора, аватар (`w-11.5`).
 */
const ROW_CHECKBOX_PX = 20;
const ROW_AVATAR_PX = 46;
const ROW_RESERVE_PX = QUOTE_GAP_PX + ROW_CHECKBOX_PX;
const AVATAR_ROW_RESERVE_PX = ROW_RESERVE_PX + ROW_AVATAR_PX;

/**
 * Пузырь стикера — стикер и его отступы в пузыре; пузырь GIF amo не шире 65% ряда, и рядом
 * с ним остаётся не меньше 35%.
 */
const STICKER_BUBBLE_MAX_PX = STICKER_MAX_SIDE_PX + 2 * MEDIA_INSET_PX;
const GIF_FREE_ROW_SHARE = 35;

/**
 * @param reservePx — что ещё занимает ряд рядом с пузырём
 * @returns ширина плашки у GIF: не больше доли ряда, которую оставляет пузырь GIF
 */
const gifQuoteMaxWidth = (reservePx: number) => {
  return `min(${QUOTE_MAX_WIDTH_PX}px, calc(${GIF_FREE_ROW_SHARE}cqw - ${reservePx}px))`;
};

/**
 * @param reservePx — что ещё занимает ряд рядом с пузырём
 * @returns ширина плашки у стикера: ряд минус пузырь стикера
 */
const stickerQuoteMaxWidth = (reservePx: number) => {
  return `min(${QUOTE_MAX_WIDTH_PX}px, calc(100cqw - ${STICKER_BUBBLE_MAX_PX + reservePx}px))`;
};

/**
 * @param reservePx — что ещё занимает ряд рядом с пузырём
 * @returns ширина ряда, уже которой плашка у GIF была бы уже `QUOTE_MIN_WIDTH_PX`
 */
const gifNarrowRowPx = (reservePx: number) => {
  return Math.ceil(((QUOTE_MIN_WIDTH_PX + reservePx) * 100) / GIF_FREE_ROW_SHARE);
};

/**
 * @param reservePx — что ещё занимает ряд рядом с пузырём
 * @returns ширина ряда, уже которой плашка у стикера была бы уже `QUOTE_MIN_WIDTH_PX`
 */
const stickerNarrowRowPx = (reservePx: number) => {
  return QUOTE_MIN_WIDTH_PX + STICKER_BUBBLE_MAX_PX + reservePx;
};

/**
 * Узкий ряд: плашка встаёт над картинкой шириной с неё — `width: 0` не даёт ей растянуть
 * пузырь, `min-width` растягивает по картинке, которая выходит за отступ пузыря на
 * `MEDIA_INSET_PX` с каждой стороны. `min-width` сильнее `max-width` бокового режима.
 *
 * @param selector — плашки, к которым относится порог
 * @param rowPx — ширина ряда, уже которой плашка встаёт над картинкой
 * @returns правило container query
 */
const narrowQuoteRule = (selector: string, rowPx: number) => {
  return `@container ${REPLY_CONTAINER} (width < ${rowPx}px) {
  ${selector} {
    position: static;
    width: 0;
    min-width: calc(100% + ${2 * MEDIA_INSET_PX}px);
    margin: 0 -${MEDIA_INSET_PX}px ${QUOTE_GAP_PX + MEDIA_INSET_PX}px;
  }
}`;
};

/**
 * Над зоной наведения пузыря (`::after`, поверх соседнего места ряда) и панелью действий
 * (`z-20`): иначе клик по цитате ушёл бы им.
 */
const QUOTE_Z_INDEX = 30;

/**
 * Кнопка медиа стикера: её `div` задаёт место под картинку, `img` — сам стикер.
 */
const STICKER_SELECTOR = `${MEDIA_PATH} > ${MEDIA_CONTAINER_SELECTOR}:has(> div > ${STICKER_IMG_SELECTOR})`;

/**
 * Место под картинку amo задаёт inline `width` / `height` у `div` над `img`, а кнопка держит
 * `min-width` / `min-height: 100px` — сбрасываются оба, иначе вокруг стикера осталась бы
 * пустая рамка прежнего размера. `!important` — только против inline-стиля amo.
 *
 * `object-fit: contain` — у всех наших картинок: при `object-cover` и неполном сбросе размеров
 * стикер обрезался бы. Оверлей времени и статуса не трогается.
 */
const MESSAGE_CSS = `
${BUBBLE_SELECTOR} {
  background: none;
  box-shadow: none;
  border-radius: 0;
}
${TAIL_SELECTOR},
${BLUR_SELECTOR},
${AUTHOR_SELECTOR} {
  display: none;
}
${IMG_SELECTOR} {
  object-fit: contain;
}
${STICKER_SELECTOR} {
  min-width: 0;
  min-height: 0;
  width: auto;
}
${STICKER_SELECTOR} > div:has(> img) {
  width: auto !important;
  height: auto !important;
}
${QUOTE_SELECTOR} {
  position: absolute;
  top: ${MEDIA_INSET_PX}px;
  left: calc(100% + ${QUOTE_GAP_PX}px);
  z-index: ${QUOTE_Z_INDEX};
  width: max-content;
  max-width: ${gifQuoteMaxWidth(ROW_RESERVE_PX)};
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-radius: ${BUBBLE_RADIUS};
  box-shadow: ${BUBBLE_SHADOW};
  background: ${BUBBLE_BACKGROUND.incoming};
}
html.dark ${QUOTE_SELECTOR} {
  background: ${BUBBLE_BACKGROUND.incomingDark};
}
${STICKER_QUOTE_SELECTOR} {
  max-width: ${stickerQuoteMaxWidth(ROW_RESERVE_PX)};
}
${WITH_AVATAR_SELECTOR}${QUOTE_SELECTOR} {
  max-width: ${gifQuoteMaxWidth(AVATAR_ROW_RESERVE_PX)};
}
${WITH_AVATAR_SELECTOR}${STICKER_QUOTE_SELECTOR} {
  max-width: ${stickerQuoteMaxWidth(AVATAR_ROW_RESERVE_PX)};
}
${OUTGOING_SELECTOR}${QUOTE_SELECTOR} {
  left: auto;
  right: calc(100% + ${QUOTE_GAP_PX}px);
  background: ${BUBBLE_BACKGROUND.outgoing};
}
html.dark ${OUTGOING_SELECTOR}${QUOTE_SELECTOR} {
  background: ${BUBBLE_BACKGROUND.outgoingDark};
}
${REPLY_ROW_SELECTOR} {
  container: ${REPLY_CONTAINER} / inline-size;
}
${narrowQuoteRule(GIF_QUOTE_SELECTOR, gifNarrowRowPx(ROW_RESERVE_PX))}
${narrowQuoteRule(STICKER_QUOTE_SELECTOR, stickerNarrowRowPx(ROW_RESERVE_PX))}
${narrowQuoteRule(`${WITH_AVATAR_SELECTOR}${GIF_QUOTE_SELECTOR}`, gifNarrowRowPx(AVATAR_ROW_RESERVE_PX))}
${narrowQuoteRule(`${WITH_AVATAR_SELECTOR}${STICKER_QUOTE_SELECTOR}`, stickerNarrowRowPx(AVATAR_ROW_RESERVE_PX))}
${REPLY_CONTROLS_SELECTOR} {
  top: auto;
  bottom: 0;
}
${STICKER_SELECTOR} > div > ${STICKER_IMG_SELECTOR} {
  width: auto;
  height: auto;
  max-width: ${STICKER_MAX_SIDE_PX}px;
  max-height: ${STICKER_MAX_SIDE_PX}px;
}
`;

/**
 * Стиль своих сообщений — один глобальный `<style>` в документе amo: CSS сам применяется к
 * сообщениям, которые появятся в ленте позже, без слежения за её DOM. Повторный вызов
 * ничего не делает.
 */
export const injectMessageStyle = () => {
  if (document.getElementById(MESSAGE_STYLE_ID)) return;
  const style = document.createElement('style');

  style.id = MESSAGE_STYLE_ID;
  style.textContent = MESSAGE_CSS;
  document.head.append(style);
};
