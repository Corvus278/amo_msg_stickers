import type { Pack } from '../../../db.types';
import type { FeedSticker } from '../StickersMode/feedSections/feedSections.types';

import type { CoverBitmaps } from './coverBitmaps/coverBitmaps.types';

export type PackCoverProps = {
  /**
   * Пак вкладки: из него — стикер-обложка и подпись пака без стикеров.
   */
  pack: Pack;

  /**
   * Стикеры раздела пака в порядке ленты.
   */
  items: FeedSticker[];

  /**
   * Кэш битмапов обложек открытого попапа; `null` — попап закрыт.
   */
  bitmaps: CoverBitmaps<ImageBitmap> | null;
};
