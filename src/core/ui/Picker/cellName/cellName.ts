import type { RemoteGif, StickerRec } from '../../../db.types';
import { t } from '../../../i18n/translate';

import type { CellNames } from './cellName.types';

/**
 * Имена кнопок ячейки стикера. Подпись своего стикера — то, что на нём написано, и по ней его
 * узнают на слух; у стикера из Telegram подписи нет, и соседние стикеры отличает эмодзи.
 *
 * Каждое имя — целая фраза словаря, а не глагол плюс имя стикера: склейка переведённых кусков навязала
 * бы английскому русский порядок слов. Подпись и эмодзи — данные пользователя и не переводятся.
 *
 * @param sticker — подпись и эмодзи стикера; нет обоих — имена без них
 * @returns имена кнопки отправки и контекстного меню
 */
export const stickerCellName = (
  sticker: Pick<StickerRec, 'emoji' | 'caption'>
): CellNames => {
  const { emoji, caption } = sticker;

  if (caption) {
    return {
      send: t('cell.sticker.sendCaption', { caption }),
      menu: t('cell.sticker.menuCaption', { caption }),
    };
  }

  if (emoji) {
    return {
      send: t('cell.sticker.sendEmoji', { emoji }),
      menu: t('cell.sticker.menuEmoji', { emoji }),
    };
  }

  return { send: t('cell.sticker.send'), menu: t('cell.sticker.menu') };
};

/**
 * Имена кнопок ячейки найденной GIF. Название GIF — данные источника и не переводится.
 *
 * @param gif — GIF из поиска
 * @returns имена кнопки отправки и контекстного меню
 */
export const gifCellName = (gif: RemoteGif): CellNames => {
  const { title } = gif;

  if (title) {
    return {
      send: t('cell.gif.sendTitle', { title }),
      menu: t('cell.gif.menuTitle', { title }),
    };
  }

  return { send: t('cell.gif.send'), menu: t('cell.gif.menu') };
};
