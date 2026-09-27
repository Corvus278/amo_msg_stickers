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

  /**
   * Колбэк на выбор «Убрать из недавних» в контекстном меню. Не задан — у ячейки нет своего
   * меню, правый клик открывает меню браузера.
   */
  onRemove?: ((gif: RemoteGif) => void) | undefined;
};
