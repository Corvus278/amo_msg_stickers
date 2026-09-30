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
   * Что убирает пункт удаления. Нет `kind` — нет и пункта: у найденной GIF в меню один
   * «Предпросмотр».
   */
  kind?: CellRemoveKind | undefined;

  /**
   * Где открыто меню и куда вернуть фокус.
   */
  opening: MenuOpening;

  /**
   * Колбэк на закрытие меню.
   */
  onClose: () => void;

  /**
   * Колбэк на выбор пункта «Предпросмотр» — после закрытия меню. Читает источник из
   * `opening.source` тот, кто открыл меню.
   */
  onPreview: () => void;

  /**
   * Колбэк на выбор пункта удаления: элемент ячейки убирается. Нужен вместе с `kind`.
   */
  onRemove?: () => void;
};
