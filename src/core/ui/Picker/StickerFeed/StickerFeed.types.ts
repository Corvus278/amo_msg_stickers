import type { RefObject } from 'preact';

import type { SendItem } from '../../../db.types';
import type { RowRange, StickerLayout } from '../stickerLayout/stickerLayout.types';
import type {
  FeedSection,
  FeedSticker,
} from '../StickersMode/feedSections/feedSections.types';

export type StickerFeedProps = {
  /**
   * Разделы ленты: из них названия заголовков и подсказки пустых разделов.
   */
  sections: FeedSection[];

  /**
   * Раскладка разделов; `null` — ширина ленты ещё не известна, рядов нет.
   */
  layout: StickerLayout<FeedSticker> | null;

  /**
   * Ряды раскладки, которые рисуются: окно видимой области с запасом.
   */
  range: RowRange;

  /**
   * Раздел, в котором верх видимой области, — лента подписана его вкладкой.
   */
  activeId: string | null;

  /**
   * Прокручиваемый элемент ленты: его размеры и прокрутку читает окно рядов.
   */
  scrollRef: RefObject<HTMLDivElement>;

  /**
   * Колбэк на прокрутку ленты.
   */
  onScroll: () => void;

  /**
   * Колбэк на удаление элемента ячейки раздела.
   */
  onCellDelete: (sectionId: string, item: SendItem) => void;
};
