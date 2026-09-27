import type { ComponentChildren } from 'preact';

export type SectionTabProps = {
  /**
   * id вкладки — на него ссылается лента, пока вкладка выбрана.
   */
  id: string;

  /**
   * Подсказка вкладки — она же её доступное имя: внутри иконка или обложка.
   */
  title: string;

  /**
   * Выбрана ли вкладка: её раздел — в верху видимой области ленты.
   */
  isSelected: boolean;

  /**
   * Стоит ли вкладка в порядке Tab: у полосы в нём ровно одна вкладка.
   */
  isFocusable: boolean;

  /**
   * Колбэк на выбор вкладки кликом, Enter или пробелом.
   */
  onSelect: () => void;

  /**
   * Иконка или обложка вкладки.
   */
  children: ComponentChildren;
};
