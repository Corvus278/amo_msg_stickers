import type { RemoteGif } from '../../../../db.types';

export type MasonryCellProps = {
  /**
   * GIF из поиска: превью в ячейке, по нажатию отправляется полноразмерная.
   */
  gif: RemoteGif;
};
