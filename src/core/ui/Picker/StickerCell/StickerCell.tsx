import { cva } from 'class-variance-authority';
import type {
  FunctionComponent as FC,
  TargetedKeyboardEvent,
  TargetedMouseEvent,
} from 'preact';

import { CellMenu } from '../Menu/CellMenu/CellMenu';
import { isMenuKey } from '../Menu/menuKey/menuKey';
import { useContextMenu } from '../Menu/useContextMenu/useContextMenu';
import { useCellSend } from '../useCellSend/useCellSend';

import type { StickerCellProps } from './StickerCell.types';

/**
 * Занятая отправкой ячейка приглушена и не принимает клики до конца отправки.
 */
const cellVariants = cva(
  [
    'flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
    'transition-colors duration-base hover:bg-cadetGray-30/[.14] dark:hover:bg-white-0/[.07]',
  ],
  {
    variants: {
      isBusy: {
        true: 'pointer-events-none opacity-40',
      },
    },
  }
);

/**
 * Ячейка стикера: отправка нажатием, удаление — пунктом контекстного меню.
 *
 * Меню стоит рядом с кнопкой, а не внутри: кнопка внутри кнопки — невалидный HTML. В сетке
 * ряда оно места не занимает — у него `position: fixed`.
 */
export const StickerCell: FC<StickerCellProps> = (props) => {
  const { item, url, name, removeKind, onRemove } = props;
  const { isBusy, sendItem } = useCellSend(item);
  const { opening, open, close } = useContextMenu();

  const handleSendClick = () => {
    void sendItem();
  };

  const handleSendContextMenu = (event: TargetedMouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY, currentTarget } = event;

    event.preventDefault();
    open({ left: clientX, top: clientY }, currentTarget);
  };

  const handleSendKeyDown = (event: TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (!isMenuKey(event)) return;

    event.preventDefault();
    open(null, event.currentTarget);
  };

  const handleMenuClose = () => {
    close();
  };

  const handleItemRemove = () => {
    onRemove(item);
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Отправить ${name}`}
        aria-haspopup="menu"
        disabled={isBusy}
        className={cellVariants({ isBusy })}
        onClick={handleSendClick}
        onContextMenu={handleSendContextMenu}
        onKeyDown={handleSendKeyDown}
      >
        <img
          src={url}
          alt=""
          loading="lazy"
          className="pointer-events-none block max-h-full max-w-full object-contain"
        />
      </button>

      {opening && (
        <CellMenu
          key={opening.seq}
          name={name}
          kind={removeKind}
          opening={opening}
          onClose={handleMenuClose}
          onRemove={handleItemRemove}
        />
      )}
    </>
  );
};
