import type { FunctionComponent as FC } from 'preact';

import { MenuItem } from '../../Menu/MenuItem/MenuItem';
import { useMenuClose } from '../../Menu/useMenuClose/useMenuClose';
import { useConfirmPress } from '../../useConfirmPress/useConfirmPress';

import type { DeletePackItemProps } from './DeletePackItem.types';

/**
 * Пункт «Удалить пак» с подтверждением повторным выбором: первый выбор меняет подпись на
 * «Точно удалить?» и оставляет меню открытым, второй за 2,5 с закрывает меню и удаляет пак.
 */
export const DeletePackItem: FC<DeletePackItemProps> = (props) => {
  const { onConfirm } = props;
  const closeMenu = useMenuClose();
  const { isArmed, press } = useConfirmPress();

  const handleItemSelect = () => {
    if (!press()) return;

    closeMenu();
    onConfirm();
  };

  return (
    <MenuItem variant="danger" onSelect={handleItemSelect}>
      {isArmed ? 'Точно удалить?' : 'Удалить пак'}
    </MenuItem>
  );
};
