import type { RemoteGif } from '../../../../db.types';
import type { TileRect } from '../tileBox/tileBox.types';

export type MasonryCellProps = {
  /**
   * GIF из поиска: превью в ячейке, по нажатию отправляется полноразмерная.
   */
  gif: RemoteGif;

  /**
   * Место и размер ячейки в ленте.
   */
  box: TileRect;
};
