import type { RemoteGif, StickerRec } from '../../../db.types';

/**
 * Имя стикера для кнопок ячейки. Подпись своего стикера — то, что на нём написано, и по ней его
 * узнают на слух; у стикера из Telegram подписи нет, и соседние стикеры отличает эмодзи.
 *
 * @param sticker — подпись и эмодзи стикера; нет обоих — имя без них
 * @returns имя в винительном падеже: «стикер «привет»», «стикер 😀»
 */
export const stickerCellName = (
  sticker: Pick<StickerRec, 'emoji' | 'caption'>
): string => {
  const { emoji, caption } = sticker;

  if (caption) return `стикер «${caption}»`;

  return emoji ? `стикер ${emoji}` : 'стикер';
};

/**
 * Имя найденной GIF для кнопок ячейки.
 *
 * @param gif — GIF из поиска
 * @returns имя в винительном падеже, «GIF «cat»»
 */
export const gifCellName = (gif: RemoteGif): string => {
  const { title } = gif;

  return title ? `GIF «${title}»` : 'GIF';
};
