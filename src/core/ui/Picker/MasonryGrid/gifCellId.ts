import type { RemoteGif } from '../../../db.types';

/**
 * Ключ GIF в разделе ленты: id уникален только у своего провайдера.
 *
 * @param gif — GIF из поиска
 * @returns ключ GIF
 */
export const gifKey = (gif: RemoteGif): string => {
  const { provider, id } = gif;

  return `${provider}:${id}`;
};

/**
 * id кнопки ячейки недавней GIF: по нему фокус находит соседнюю ячейку после «Убрать из
 * недавних». id есть только у недавних — та же GIF может стоять и в выдаче, а id в shadow root
 * пикера не должны повторяться.
 *
 * @param key — ключ GIF из `gifKey`
 * @returns id кнопки ячейки
 */
export const gifCellId = (key: string): string => {
  return `picker-gif-cell-${key}`;
};
