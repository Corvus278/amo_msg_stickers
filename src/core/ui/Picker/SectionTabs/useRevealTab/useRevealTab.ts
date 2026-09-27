import type { RefObject } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

import { revealScrollLeft } from '../revealScrollLeft/revealScrollLeft';

/**
 * Держит выбранную вкладку полосы в видимой части: при смене раздела полоса прокручивается вбок
 * ровно настолько, чтобы вкладка была видна целиком. Скрытая полоса без ширины не прокручивается:
 * расчёт по нулевой ширине увёл бы её за вкладку.
 *
 * `offsetLeft` вкладки считается вместе с внутренним отступом полосы, поэтому отступ передаётся
 * расчёту: без него переход к первой вкладке увёл бы левый отступ полосы за край.
 *
 * Прокрутка ставится в layout-эффекте, до отрисовки: в обычном эффекте кадр успел бы показать
 * полосу со старой прокруткой, и вкладка прыгала бы на место.
 *
 * @param activeId — раздел выбранной вкладки
 * @returns ссылка на полосу вкладок; полоса — `position: relative`, от неё считается `offsetLeft`
 */
export const useRevealTab = (activeId: string | null): RefObject<HTMLDivElement> => {
  const stripRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelector<HTMLElement>('[aria-selected="true"]');

    if (!strip?.clientWidth || !tab) return;

    strip.scrollLeft = revealScrollLeft(
      { left: tab.offsetLeft, width: tab.offsetWidth },
      {
        scrollLeft: strip.scrollLeft,
        width: strip.clientWidth,
        inset: Number.parseFloat(getComputedStyle(strip).paddingLeft) || 0,
      }
    );
  }, [activeId]);

  return stripRef;
};
