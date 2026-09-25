import type { FunctionComponent as FC } from 'preact';

import { Button } from '../../Button/Button';
import { useConfirmPress } from '../../useConfirmPress/useConfirmPress';

import type { DeletePackButtonProps } from './DeletePackButton.types';

/**
 * «Удалить пак» с подтверждением повторным нажатием: первое нажатие меняет подпись на
 * «Точно удалить?», без второго за 2,5 с подпись возвращается.
 */
export const DeletePackButton: FC<DeletePackButtonProps> = (props) => {
  const { onConfirm } = props;
  const { isArmed, press } = useConfirmPress();

  const handleDeleteClick = () => {
    if (press()) onConfirm();
  };

  return (
    <Button variant="danger" onClick={handleDeleteClick}>
      {isArmed ? 'Точно удалить?' : 'Удалить пак'}
    </Button>
  );
};
