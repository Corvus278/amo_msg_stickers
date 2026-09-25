import type { RemoteGif } from '../../../db.types';

/**
 * Имя стикера для кнопок ячейки: эмодзи из Telegram отличает соседние стикеры на слух.
 *
 * @param emoji — эмодзи стикера; нет — имя без него
 * @returns имя в винительном падеже, «стикер 😀»
 */
export const stickerCellName = (emoji: string | undefined): string => {
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
