import type { FunctionComponent as FC } from 'preact';

import type { GridHeaderProps } from './GridHeader.types';

const HEADER_CLASS =
  'absolute inset-x-0 m-0 flex items-center px-1 font-primary text-xsm font-semibold text-cadetGray-30 dark:text-gray-70';

/**
 * Строка заголовка раздела ленты GIF во всю ширину, на месте из раскладки. Вид — как у
 * заголовков ленты стикеров: оба режима читаются одной иерархией.
 */
export const GridHeader: FC<GridHeaderProps> = (props) => {
  const { title, top, height } = props;

  return (
    <h2 className={HEADER_CLASS} style={{ top, height }}>
      <span className="min-w-0 truncate">{title}</span>
    </h2>
  );
};
