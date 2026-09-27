import type { FunctionComponent as FC } from 'preact';

import { MenuItem } from '../../MenuItem/MenuItem';
import type { MenuItemVariant } from '../../MenuItem/MenuItem.types';
import { useMenuClose } from '../../useMenuClose/useMenuClose';
import type { CellRemoveKind } from '../CellMenu.types';

import type { RemoveItemProps } from './RemoveItem.types';

const REMOVE_LABEL: Record<CellRemoveKind, string> = {
  sticker: 'Удалить стикер',
  recent: 'Убрать из недавних',
};

/**
 * Удаление стикера необратимо — пункт красный; из недавних элемент вернёт следующая отправка.
 */
const REMOVE_VARIANT: Record<CellRemoveKind, MenuItemVariant> = {
  sticker: 'danger',
  recent: 'default',
};

/**
 * Пункт меню ячейки, убирающий её элемент. Без подтверждения: стикер — один, а не пак.
 */
export const RemoveItem: FC<RemoveItemProps> = (props) => {
  const { kind, onRemove } = props;
  const closeMenu = useMenuClose();

  const handleItemSelect = () => {
    closeMenu();
    onRemove();
  };

  return (
    <MenuItem variant={REMOVE_VARIANT[kind]} onSelect={handleItemSelect}>
      {REMOVE_LABEL[kind]}
    </MenuItem>
  );
};
