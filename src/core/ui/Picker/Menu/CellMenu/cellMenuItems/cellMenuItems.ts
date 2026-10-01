import type { CellRemoveKind } from '../CellMenu.types';

import type { CellMenuItemId } from './cellMenuItems.types';

/**
 * Состав меню ячейки по порядку: «Предпросмотр» всегда первый, удаление — только там, где у
 * ячейки есть что убирать. У найденной GIF `kind` нет, и меню состоит из одного пункта.
 *
 * @param kind — что убирает пункт удаления; нет — удаления нет
 * @returns пункты меню сверху вниз
 */
export const cellMenuItems = (kind: CellRemoveKind | undefined): CellMenuItemId[] => {
  if (kind === undefined) return ['preview'];

  return ['preview', 'remove'];
};
