import type { SendItem } from '../../../db.types';

export type StickerCellProps = {
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
   * доступные имена кнопок отправки и удаления.
   */
  name: string;

  /**
   * Колбэк на удаление элемента ячейки. Не задан — кнопки удаления нет.
   */
  onDelete?: (item: SendItem) => void;
};
