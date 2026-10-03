/**
 * Фасад DOM amo web для ядра: поле ввода, видимость его кнопок, тема и стиль своих сообщений.
 *
 * Страница amo бывает в двух разметках — стабильной, с атрибутами `data-*` (`amoDomStable.ts`), и
 * прежней, по классам и структуре (`amoDomLegacy.ts`). Ядро не знает, какая из них на странице:
 * фасад спрашивает обе, а разметки друг с другом не пересекаются.
 */

import type { AmoMarkup, Composer, SendComposer } from './amoDom.types';
import { legacyMarkup } from './amoDomLegacy';
import { stableMarkup } from './amoDomStable';
import { messageCss } from './amoDomStyle';

const MARKUPS: AmoMarkup[] = [stableMarkup, legacyMarkup];

export const findComposers = (root: ParentNode = document): Composer[] => {
  return MARKUPS.flatMap((markup) => {
    return markup.findComposers(root);
  });
};

export const composerOf = (el: Element): Composer | null => {
  return (
    findComposers().find(({ row }) => {
      return row.contains(el);
    }) || null
  );
};

export const isEditing = ({
  cancelEditButton,
  markup,
}: Pick<SendComposer, 'cancelEditButton' | 'markup'>) => {
  return Boolean(cancelEditButton && markup.isShown(cancelEditButton));
};

/**
 * Кнопка «Отправить» видна, если есть текст или вложения.
 */
export const isDraftEmpty = ({
  sendButton,
  markup,
}: Pick<SendComposer, 'sendButton' | 'markup'>) => {
  return !sendButton || !markup.isShown(sendButton);
};

export const isDarkTheme = () => {
  return document.documentElement.classList.contains('dark');
};

const MESSAGE_STYLE_ID = 'amo-stickers-message';

/**
 * Стиль своих сообщений — один глобальный `<style>` в документе amo с правилами обеих разметок:
 * CSS сам применяется к сообщениям, которые появятся в ленте позже, без слежения за её DOM, а
 * срабатывают правила той разметки, что на странице. Повторный вызов ничего не делает.
 */
export const injectMessageStyle = () => {
  if (document.getElementById(MESSAGE_STYLE_ID)) return;
  const style = document.createElement('style');

  style.id = MESSAGE_STYLE_ID;
  style.textContent = MARKUPS.map(({ message }) => {
    return messageCss(message);
  }).join('\n');
  document.head.append(style);
};
