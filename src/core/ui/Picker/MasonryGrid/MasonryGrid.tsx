import type { FunctionComponent as FC } from 'preact';

import type { RemoteGif } from '../../../db.types';

import { MasonryCell } from './MasonryCell/MasonryCell';
import { splitColumns } from './splitColumns/splitColumns';
import type { MasonryGridProps } from './MasonryGrid.types';

const COLUMN_COUNT = 2;

/**
 * Геометрия в долях ширины колонки и без зазоров: ширина колонки в пикселях до рендера неизвестна, колонки
 * тянутся flex-ом.
 */
const PROPORTIONAL = { count: COLUMN_COUNT, width: 1, gap: 0 };

/**
 * Лента GIF в две колонки с сохранением пропорций: GIF разной формы, и квадратная сетка
 * обрезала бы их или оставляла пустоты.
 *
 * Колонки раскладываются в JS, а не CSS `columns`: тот заполняет колонки по очереди, и
 * новая страница выдачи попадала бы только в низ правой колонки, перетасовывая уже
 * показанные GIF между колонками.
 */
export const MasonryGrid: FC<MasonryGridProps> = (props) => {
  const { gifs } = props;
  const { tiles } = splitColumns([{ id: 'feed', items: gifs }], PROPORTIONAL);
  const columns = tiles.reduce<RemoteGif[][]>(
    (acc, tile) => {
      if (tile.kind === 'item') {
        acc[tile.column]?.push(tile.item);
      }

      return acc;
    },
    Array.from({ length: COLUMN_COUNT }, (): RemoteGif[] => {
      return [];
    })
  );

  return (
    <div className="flex items-start gap-1">
      {columns.map((column, index) => {
        return (
          <div key={index} className="flex min-w-0 flex-1 flex-col gap-1">
            {column.map((gif) => {
              return <MasonryCell key={`${gif.provider}:${gif.id}`} gif={gif} />;
            })}
          </div>
        );
      })}
    </div>
  );
};
