import type { FunctionComponent as FC } from 'preact';

import type { StickerGridProps } from './StickerGrid.types';

/**
 * Сетка стикеров в четыре квадратные колонки: стикеры квадратные, в отличие от GIF.
 */
export const StickerGrid: FC<StickerGridProps> = (props) => {
  const { children } = props;

  return <div className="grid grid-cols-4 gap-1">{children}</div>;
};
