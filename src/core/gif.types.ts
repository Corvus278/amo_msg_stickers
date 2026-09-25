export type GifInfo = {
  /**
   * Ширина логического экрана GIF в пикселях.
   */
  width: number;

  /**
   * Высота логического экрана GIF в пикселях.
   */
  height: number;

  /**
   * Сколько целых кадров удалось прочитать.
   */
  frames: number;
};
