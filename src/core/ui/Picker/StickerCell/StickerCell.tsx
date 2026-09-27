import type {
  FunctionComponent as FC,
  TargetedKeyboardEvent,
  TargetedMouseEvent,
} from 'preact';

import { CellSpinner } from '../CellSpinner/CellSpinner';
import { CellMenu } from '../Menu/CellMenu/CellMenu';
import { isMenuKey } from '../Menu/menuKey/menuKey';
import { useContextMenu } from '../Menu/useContextMenu/useContextMenu';
import { useCellSend } from '../useCellSend/useCellSend';

import type { StickerCellProps } from './StickerCell.types';

/**
 * Занятая отправкой ячейка — `disabled`: не принимает клики до конца отправки, картинка
 * приглушена, а индикатор поверх неё — нет.
 */
const CELL_CLASS = [
  'group relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
  'transition-colors duration-base hover:bg-cadetGray-30/[.14] dark:hover:bg-white-0/[.07]',
  'disabled:pointer-events-none',
].join(' ');

/**
 * Ячейка стикера: отправка нажатием, удаление — пунктом контекстного меню.
 *
 * Меню стоит рядом с кнопкой, а не внутри: кнопка внутри кнопки — невалидный HTML. В сетке
 * ряда оно места не занимает — у него `position: fixed`.
 *
 * `aria-haspopup` у кнопки нет: скринридер объявил бы её кнопкой меню, а Enter и пробел
 * отправляют стикер — меню открывают только правый клик, клавиша меню и `Shift+F10`.
 */
export const StickerCell: FC<StickerCellProps> = (props) => {
  const { id, item, url, name, removeKind, onRemove } = props;
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
        id={id}
        aria-label={`Отправить ${name}`}
        aria-busy={isBusy}
        disabled={isBusy}
        className={CELL_CLASS}
        onClick={handleSendClick}
        onContextMenu={handleSendContextMenu}
        onKeyDown={handleSendKeyDown}
      >
        {/*
         * Без `loading="lazy"`: лента стикеров декодирует картинки окна заранее, до прыжка к
         * далёкому разделу, а ленивая картинка далеко за видимой областью не грузится.
         */}
        <img
          src={url}
          alt=""
          className="pointer-events-none block max-h-full max-w-full object-contain group-disabled:opacity-40"
        />

        {isBusy && <CellSpinner />}
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
