/**
 * Всё знание о DOM amo web в одном месте.
 *
 * data-testid в amo нет: опираемся на aria-атрибуты и стабильные tailwind-классы.
 */

import type { Composer } from './amoDom.types';

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
const isShown = (el: HTMLElement | null) => {
  return Boolean(el?.classList.contains('opacity-100'));
};

export const isEditing = ({ cancelEditButton }: Composer) => {
  return isShown(cancelEditButton);
};

/**
 * Кнопка «Отправить» видна, если есть текст или вложения.
 */
export const isDraftEmpty = ({ sendButton }: Composer) => {
  return !isShown(sendButton);
};

export const isDarkTheme = () => {
  return document.documentElement.classList.contains('dark');
};
