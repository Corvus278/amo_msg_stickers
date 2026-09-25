import type { FunctionComponent as FC } from 'preact';

import type { ImportProgressProps } from './ImportProgress.types';

/**
 * Полоса прогресса импорта. Ширина — единственное inline-свойство: она меняется на каждый
 * стикер, а классов на каждый процент нет.
 */
export const ImportProgress: FC<ImportProgressProps> = (props) => {
  const { percent } = props;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="h-1 overflow-hidden rounded-[2px] bg-cadetGray-30/[.12] dark:bg-white-0/[.06]"
    >
      <div
        className="h-full bg-blue-50 transition-[width] duration-lg ease-[ease] dark:bg-beige-70"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
