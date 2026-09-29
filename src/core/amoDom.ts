/**
 * Всё знание о DOM amo web в одном месте.
 *
 * data-testid в amo нет: опираемся на aria-атрибуты и стабильные tailwind-классы.
 */

import type { Composer, SendComposer, ShownNode } from './amoDom.types';

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
 * Ответ исключён на корне: без фона цитата повисла бы в воздухе. Заголовок автора
 * (`message_with_user-`, групповой чат и канал) не исключён — его строка скрывается, как в Telegram.
 *
 * Исключён и заголовок, где имя — не кнопка, а простой `div`, как у пересылки в «Избранное». Там
 * у пересылки нет ни блока «Forwarded from», ни `forwarded-` на обёртке медиа, и заголовок с
 * именем — единственный её признак: без пузыря он повис бы над стикером.
 */
const MESSAGE_SELECTOR =
  '[id^="message+"]:not([class*="message_with_reply-"]):not(:has(> div > div > div:first-child:not([class]) > div))';

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
