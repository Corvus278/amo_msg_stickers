import type { FunctionComponent as FC } from 'preact';

import { Menu } from '../Menu';

import { RemoveItem } from './RemoveItem/RemoveItem';
import type { CellMenuProps } from './CellMenu.types';

/**
 * Контекстное меню ячейки стикера или GIF. Удаление живёт только здесь: кнопки удаления на
 * ячейках заслоняли бы сетку.
 */
export const CellMenu: FC<CellMenuProps> = (props) => {
  const { name, kind, opening, onClose, onRemove } = props;
  const { anchor, source } = opening;

  return (
    <Menu label={`Действия: ${name}`} anchor={anchor} source={source} onClose={onClose}>
      <RemoveItem kind={kind} onRemove={onRemove} />
    </Menu>
  );
};
