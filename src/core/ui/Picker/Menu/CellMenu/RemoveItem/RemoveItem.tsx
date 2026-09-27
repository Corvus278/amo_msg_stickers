import type { FunctionComponent as FC } from 'preact';

import type { MessageKey } from '../../../../../i18n/i18n.types';
import { t } from '../../../../../i18n/translate';
import { MenuItem } from '../../MenuItem/MenuItem';
import type { MenuItemVariant } from '../../MenuItem/MenuItem.types';
import { useMenuClose } from '../../useMenuClose/useMenuClose';
import type { CellRemoveKind } from '../CellMenu.types';

import type { RemoveItemProps } from './RemoveItem.types';

/**
 * Ключи, а не тексты: язык выбирается в `start()`, после вычисления модуля.
 */
const REMOVE_LABEL: Record<CellRemoveKind, MessageKey> = {
  sticker: 'menu.removeSticker',
  recent: 'menu.removeRecent',
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
      {t(REMOVE_LABEL[kind])}
    </MenuItem>
  );
};
