import type { FunctionComponent as FC } from 'preact';

import { MasonryCell } from './MasonryCell/MasonryCell';
import { splitColumns } from './splitColumns/splitColumns';
import type { MasonryGridProps } from './MasonryGrid.types';

const COLUMN_COUNT = 2;

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
  const columns = splitColumns(gifs, COLUMN_COUNT);

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
