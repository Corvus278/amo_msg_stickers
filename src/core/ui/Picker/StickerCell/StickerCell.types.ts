import type { SendItem } from '../../../db.types';
import type { CellRemoveKind } from '../Menu/CellMenu/CellMenu.types';

export type StickerCellProps = {
  /**
   * id кнопки ячейки — по нему ячейку находит фокус после удаления соседней.
   */
  id?: string;

  /**
   * Что отправляет ячейка по нажатию.
   */
  item: SendItem;

  /**
   * Адрес картинки стикера или превью GIF.
   */
  url: string;

  /**
   * Что в ячейке, в винительном падеже («стикер 😀», «GIF «cat»»): из него собираются
   * доступные имена кнопки отправки и контекстного меню.
   */
  name: string;

  /**
   * Что убирает пункт контекстного меню: стикер из библиотеки или элемент из недавних.
   */
  removeKind: CellRemoveKind;

  /**
   * Колбэк на выбор пункта контекстного меню — элемент ячейки убирается.
   */
  onRemove: (item: SendItem) => void;
};
