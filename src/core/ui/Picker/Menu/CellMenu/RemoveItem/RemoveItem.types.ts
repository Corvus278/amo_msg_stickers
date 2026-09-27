import type { CellRemoveKind } from '../CellMenu.types';

export type RemoveItemProps = {
  /**
   * Что убирает пункт: от этого его подпись и цвет.
   */
  kind: CellRemoveKind;

  /**
   * Колбэк на выбор пункта — после закрытия меню.
   */
  onRemove: () => void;
};
