import { cva } from 'class-variance-authority';
import type {
  FunctionComponent as FC,
  TargetedKeyboardEvent,
  TargetedMouseEvent,
} from 'preact';

import type { SendItem } from '../../../../db.types';
import { gifCellName } from '../../cellName/cellName';
import { CellMenu } from '../../Menu/CellMenu/CellMenu';
import { isMenuKey } from '../../Menu/menuKey/menuKey';
import { useContextMenu } from '../../Menu/useContextMenu/useContextMenu';
import { useCellSend } from '../../useCellSend/useCellSend';

import type { MasonryCellProps } from './MasonryCell.types';

/**
 * Размер ячейки задан раскладкой до загрузки превью: иначе колонки перестраивались бы на
 * каждой загруженной картинке. Заливка поля ввода видна, пока превью грузится.
 */
const cellVariants = cva(
  [
    'absolute block cursor-pointer overflow-hidden rounded-lg p-0',
    'bg-cadetGray-30/[.12] dark:bg-white-0/[.06]',
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
 * Ячейка GIF в ленте, абсолютно поставленная на место из раскладки. Контекстное меню
 * «Убрать из недавних» — только у недавних: найденные GIF не хранятся.
 */
export const MasonryCell: FC<MasonryCellProps> = (props) => {
  const { gif, box, onRemove } = props;
  const { previewUrl } = gif;
  const item: SendItem = { kind: 'remote', gif };
  const name = gifCellName(gif);
  const { isBusy, sendItem } = useCellSend(item);
  const { opening, open, close } = useContextMenu();

  const handleCellClick = () => {
    void sendItem();
  };

  const handleCellContextMenu = (event: TargetedMouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY, currentTarget } = event;

    if (!onRemove) return;

    event.preventDefault();
    open({ left: clientX, top: clientY }, currentTarget);
  };

  const handleCellKeyDown = (event: TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (!onRemove || !isMenuKey(event)) return;

    event.preventDefault();
    open(null, event.currentTarget);
  };

  const handleMenuClose = () => {
    close();
  };

  const handleItemRemove = () => {
    onRemove?.(gif);
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Отправить ${name}`}
        aria-haspopup={onRemove ? 'menu' : undefined}
        disabled={isBusy}
        className={cellVariants({ isBusy })}
        style={box}
        onClick={handleCellClick}
        onContextMenu={handleCellContextMenu}
        onKeyDown={handleCellKeyDown}
      >
        <img
          src={previewUrl}
          alt=""
          loading="lazy"
          className="pointer-events-none block size-full object-cover"
        />
      </button>

      {opening && (
        <CellMenu
          key={opening.seq}
          name={name}
          kind="recent"
          opening={opening}
          onClose={handleMenuClose}
          onRemove={handleItemRemove}
        />
      )}
    </>
  );
};
