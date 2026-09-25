import type { FunctionComponent as FC } from 'preact';

import { MasonryCell } from './MasonryCell/MasonryCell';
import type { MasonryGridProps } from './MasonryGrid.types';

/**
 * Лента GIF в две колонки с сохранением пропорций: GIF разной формы, и квадратная сетка
 * обрезала бы их или оставляла пустоты.
 */
export const MasonryGrid: FC<MasonryGridProps> = (props) => {
  const { gifs } = props;

  return (
    <div className="columns-2 gap-1">
      {gifs.map((gif) => {
        return <MasonryCell key={`${gif.provider}:${gif.id}`} gif={gif} />;
      })}
    </div>
  );
};
