import type { StickerRow } from '../../stickerLayout/stickerLayout.types';
import type { FeedSticker } from '../../StickersMode/feedSections/feedSections.types';

export type FeedRowProps = {
  /**
   * Ряд ячеек раскладки с готовой геометрией.
   */
  row: StickerRow<FeedSticker>;

  /**
   * Подсказка пустого раздела — текст ряда ячеек без стикеров.
   */
  hint: string;

  /**
   * Колбэк на удаление элемента ячейки: стикера из пака или элемента из недавних — по разделу
   * ряда.
   */
  onCellDelete: (cell: FeedSticker) => void;
};
