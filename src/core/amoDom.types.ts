import type { MarkableNode } from './pageClient.types';

export type Composer = {
  /**
   * Поле ввода (contenteditable).
   */
  editable: HTMLElement;

  /**
   * Строка инпута: [скрепка][текст][@][эмодзи][микрофон].
   */
  row: HTMLElement;

  /**
   * Обёртка кнопки эмодзи — кнопка стикеров встаёт сразу после неё.
   */
  emojiWrap: HTMLElement;

  /**
   * Кнопка «Отправить». null — не нашлась в разметке.
   */
  sendButton: HTMLElement | null;

  /**
   * Кнопка отмены редактирования сообщения. null — не нашлась в разметке.
   */
  cancelEditButton: HTMLElement | null;
};

/**
 * Узел, видимость которого amo переключает классом `opacity-100`.
 */
export type ShownNode = {
  /**
   * Классы узла.
   */
  classList: Pick<DOMTokenList, 'contains'>;
};

/**
 * Срез `Composer`, который нужен отправке: поле ввода — для команды агенту и вставки, кнопки —
 * для проверок черновика и клика «Отправить». `Composer` подходит под него как есть.
 */
export type SendComposer = {
  /**
   * Поле ввода: его помечает команда агенту, в него идёт вставка на запасном пути.
   */
  editable: MarkableNode & Pick<HTMLElement, 'focus' | 'dispatchEvent'>;

  /**
   * Кнопка «Отправить»: видна, если в поле текст или вложения. null — не нашлась.
   */
  sendButton: (ShownNode & Pick<HTMLElement, 'click'>) | null;

  /**
   * Кнопка отмены редактирования: видна, пока идёт редактирование. null — не нашлась.
   */
  cancelEditButton: ShownNode | null;
};

/**
 * Вариант плашки цитаты стикера-ответа.
 */
export type QuoteLayout = {
  /**
   * Селектор плашек этого варианта.
   */
  selector: string;

  /**
   * Вид картинки: от него зависит, сколько места рядом с ней оставляет пузырь.
   */
  media: 'sticker' | 'gif';

  /**
   * Что ещё занимает ряд рядом с пузырём, px: зазор, слот чекбокса и, если есть, аватар.
   */
  reservePx: number;
};

/**
 * Место плашки рядом с картинкой.
 */
export type QuoteRoom = {
  /**
   * Свободное место рядом с картинкой — выражение для `calc()` в единицах ряда (`cqw`).
   */
  freeCalc: string;

  /**
   * Ширина ряда, px, уже которой плашка встаёт над картинкой.
   */
  narrowRowPx: number;
};
