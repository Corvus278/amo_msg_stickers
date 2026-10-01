/**
 * Чем закрыт предпросмотр.
 */
export type PreviewCloseReason = 'escape' | 'click' | 'focusout';

/**
 * Элемент, на который может вернуться фокус.
 */
export type PreviewFocusSource = {
  /**
   * Лежит ли элемент в документе: ячейка под виртуализацией могла размонтироваться.
   */
  isConnected: boolean;
};

/**
 * Атрибуты корня оверлея, зависящие от способа открытия.
 */
export type PreviewAttributes = {
  /**
   * Роль: у закреплённого предпросмотра — диалог.
   */
  role?: 'dialog';

  /**
   * Имя диалога.
   */
  'aria-label'?: string;

  /**
   * Скрыт ли предпросмотр удержания от скринридера.
   */
  'aria-hidden'?: 'true';
};
