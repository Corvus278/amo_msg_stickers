import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../../db.types';
import { useCellSend } from '../../StickerCell/useCellSend/useCellSend';

import type { MasonryCellProps } from './MasonryCell.types';

/**
 * Пропорции ячейки задаются до загрузки превью: иначе колонки перестраивались бы на
 * каждой загруженной картинке. Заливка поля ввода видна, пока превью грузится.
 */
const cellVariants = cva(
  [
    'mb-1 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg p-0',
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
      className={cellVariants({ isBusy })}
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
