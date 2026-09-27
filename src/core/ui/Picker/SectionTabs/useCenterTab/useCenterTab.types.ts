import type { RefObject } from 'preact';

export type CenterTabRefs = {
  /**
   * Полоса вкладок: `position: relative`, от неё считается `offsetLeft` вкладок.
   */
  stripRef: RefObject<HTMLDivElement>;

  /**
   * Индикатор выбранной вкладки внутри полосы.
   */
  indicatorRef: RefObject<HTMLDivElement>;
};
