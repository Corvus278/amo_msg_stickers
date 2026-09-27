import type { SendItem } from '../../../../db.types';
import type { StickerRow } from '../../stickerLayout/stickerLayout.types';
import type { FeedSticker } from '../../StickersMode/feedSections/feedSections.types';

export type FeedRowProps = {
  /**
   * Ряд раскладки с готовой геометрией.
   */
  row: StickerRow<FeedSticker>;

  /**
   * Название раздела — текст ряда-заголовка.
   */
  title: string;

  /**
   * Подсказка пустого раздела — текст ряда ячеек без стикеров.
   */
  hint: string;

  /**
   * Колбэк на удаление элемента ячейки.
   */
  onCellDelete: (item: SendItem) => void;
};
