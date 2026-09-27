import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../../db.types';
import { gifCellName } from '../../cellName/cellName';
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
 * Ячейка GIF в ленте, абсолютно поставленная на место из раскладки: без удаления — найденные
 * GIF не хранятся.
 */
export const MasonryCell: FC<MasonryCellProps> = (props) => {
  const { gif, box } = props;
  const { previewUrl } = gif;
  const item: SendItem = { kind: 'remote', gif };
  const { isBusy, sendItem } = useCellSend(item);

  const handleCellClick = () => {
    void sendItem();
  };

  return (
    <button
      type="button"
      aria-label={`Отправить ${gifCellName(gif)}`}
      disabled={isBusy}
      className={cellVariants({ isBusy })}
      style={box}
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
