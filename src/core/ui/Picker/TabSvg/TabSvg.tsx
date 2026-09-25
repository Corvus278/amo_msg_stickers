import type { FunctionComponent as FC } from 'preact';

import type { TabSvgProps } from './TabSvg.types';

/**
 * Иконка вкладки: 18×18 на сетке 24×24, заливка цветом текста вкладки — выбранная
 * вкладка перекрашивает иконку без своих классов.
 *
 * Иконка декоративная: подпись вкладки — её `title`.
 */
export const TabSvg: FC<TabSvgProps> = (props) => {
  const { children } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4.5 fill-current"
    >
      {children}
    </svg>
  );
};
