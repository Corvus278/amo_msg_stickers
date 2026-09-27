import type { StickerRec } from '../../../../db.types';
import type { CoverBitmaps } from '../coverBitmaps/coverBitmaps.types';

export type CoverCanvasProps = {
  /**
   * Стикер-обложка.
   */
  sticker: StickerRec;

  /**
   * Кэш битмапов обложек открытого попапа; `null` — попап закрыт.
   */
  bitmaps: CoverBitmaps<ImageBitmap> | null;
};
