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
