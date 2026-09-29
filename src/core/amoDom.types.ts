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
