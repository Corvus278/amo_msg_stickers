import { clsx } from 'clsx';
import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../../db.types';
import { useCellSend } from '../../StickerCell/useCellSend/useCellSend';

import type { MasonryCellProps } from './MasonryCell.types';

/**
 * Пропорции ячейки задаются до загрузки превью: иначе колонки перестраивались бы на
 * каждой загруженной картинке. Заливка поля ввода видна, пока превью грузится.
 */
const CELL_CLASS = [
  'mb-1 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg p-0',
  'bg-cadetGray-30/[.12] dark:bg-white-0/[.06]',
].join(' ');

/**
 * Ячейка GIF в ленте: без удаления — найденные GIF не хранятся.
 */
export const MasonryCell: FC<MasonryCellProps> = (props) => {
  const { gif } = props;
  const { width, height, previewUrl } = gif;
  const item: SendItem = { kind: 'remote', gif };
  const { isBusy, sendItem } = useCellSend(item);

  const handleCellClick = () => {
    void sendItem();
  };

  return (
    <button
      type="button"
      aria-label="Отправить"
      disabled={isBusy}
      className={clsx(CELL_CLASS, isBusy && 'pointer-events-none opacity-40')}
      style={{ aspectRatio: `${width} / ${height}` }}
      onClick={handleCellClick}
    >
      <img
        src={previewUrl}
        alt=""
        loading="lazy"
        className="pointer-events-none block size-full object-cover"
      />
    </button>
  );
};
