import type { RemoteGif } from '../../../../db.types';
import type { TileRect } from '../tileBox/tileBox.types';

export type MasonryCellProps = {
  /**
   * id кнопки ячейки: по нему фокус находит ячейку после удаления соседней. Не задан — ячейку
   * фокус после удаления не ищет.
   */
  id?: string | undefined;

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
