import type { FunctionComponent as FC } from 'preact';

import { ClearRecentButton } from '../../SectionHeader/ClearRecentButton/ClearRecentButton';

import type { GridHeaderProps } from './GridHeader.types';

const HEADER_CLASS = 'absolute inset-x-0 flex items-center gap-1 pl-1';

const TITLE_CLASS =
  'm-0 min-w-0 flex-1 truncate font-primary text-xsm font-semibold text-cadetGray-30 dark:text-gray-70';

/**
 * Строка заголовка раздела ленты GIF во всю ширину, на месте из раскладки. Вид и действие справа —
 * как у заголовков ленты стикеров: оба режима читаются одной иерархией.
 */
export const GridHeader: FC<GridHeaderProps> = (props) => {
  const { title, top, height, onClear } = props;

  const handleClearConfirm = () => {
    onClear?.();
  };

  return (
    <div className={HEADER_CLASS} style={{ top, height }}>
      <h2 className={TITLE_CLASS}>{title}</h2>

      {onClear && <ClearRecentButton onConfirm={handleClearConfirm} />}
    </div>
  );
};
