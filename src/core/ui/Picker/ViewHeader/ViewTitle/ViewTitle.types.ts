import type { ComponentChildren } from 'preact';

export type ViewTitleProps = {
  /**
   * Заголовок представления. Пока данные грузятся, его может не быть — высота строки
   * сохраняется.
   */
  title?: string | undefined;

  /**
   * Действия справа от заголовка.
   */
  children?: ComponentChildren;
};
