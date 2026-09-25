import { clsx } from 'clsx';
import type { FunctionComponent as FC } from 'preact';

import { useCellSend } from './useCellSend/useCellSend';
import type { StickerCellProps } from './StickerCell.types';

/**
 * Подсветка наведения висит на обёртке (`group`), а не на кнопке отправки: курсор над
 * кнопкой удаления тоже держит ячейку подсвеченной.
 */
const SEND_CLASS = [
  'flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
  'transition-colors duration-base',
  'group-hover:bg-cadetGray-30/[.14] dark:group-hover:bg-white-0/[.07]',
].join(' ');

/**
 * Кнопка удаления скрыта, пока курсор не над ячейкой: иначе крестики на каждом стикере
 * заслоняли бы сетку.
 */
const DELETE_CLASS = [
  'absolute right-0.5 top-0.5 hidden size-4.5 cursor-pointer rounded-full p-0 group-hover:block',
  'font-primary text-xsm leading-[18px]',
  'bg-white-0 text-cadetGray-30 shadow-[0_1px_3px] shadow-black-0/20 hover:text-red-30',
  'dark:bg-gray-10 dark:text-gray-70 dark:hover:text-red-30',
].join(' ');

/**
 * Ячейка стикера: отправка и удаление — соседние кнопки в общей обёртке, потому что
 * кнопка внутри кнопки — невалидный HTML.
 */
export const StickerCell: FC<StickerCellProps> = (props) => {
  const { item, url, onDelete } = props;
  const { isBusy, sendItem } = useCellSend(item);

  const handleSendClick = () => {
    void sendItem();
  };

  const handleDeleteClick = () => {
    onDelete?.(item);
  };

  return (
    <div className={clsx('group relative', isBusy && 'pointer-events-none opacity-40')}>
      <button
        type="button"
        aria-label="Отправить"
        disabled={isBusy}
        className={SEND_CLASS}
        onClick={handleSendClick}
      >
        <img
          src={url}
          alt=""
          loading="lazy"
          className="pointer-events-none block max-h-full max-w-full object-contain"
        />
      </button>

      {onDelete && (
        <button
          type="button"
          title="Удалить"
          className={DELETE_CLASS}
          onClick={handleDeleteClick}
        >
          ×
        </button>
      )}
    </div>
  );
};
