import type { MenuOpening } from '../Menu.types';

/**
 * Что убирает пункт меню ячейки: стикер из библиотеки или элемент из недавних.
 */
export type CellRemoveKind = 'sticker' | 'recent';

export type CellMenuProps = {
  /**
   * Название меню на языке интерфейса: «Действия: стикер 😀».
   */
  label: string;

  /**
   * Что убирает пункт меню.
   */
  kind: CellRemoveKind;

  /**
   * Где открыто меню и куда вернуть фокус.
   */
  opening: MenuOpening;

  /**
   * Колбэк на закрытие меню.
   */
  onClose: () => void;

  /**
   * Колбэк на выбор пункта: элемент ячейки убирается.
   */
  onRemove: () => void;
};
