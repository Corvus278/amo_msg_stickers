import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';

import { createScrollReset } from '../scrollReset/scrollReset';

import type { GridWindow } from './useGridWindow.types';

/**
 * Размеры и прокрутка ленты GIF для окна плиток.
 *
 * Размеры снимает `ResizeObserver`: так в ширину не попадает полоса прокрутки Windows, а показ
 * скрытой панели режима заново читает размеры и прокрутку, которую скрытие `display: none`
 * сбросило и панель вернула. Скрытая панель с нулевой шириной размеры не перезаписывает — иначе
 * лента на время скрытия теряла бы раскладку и при показе мигала пустой.
 *
 * Смена `resetKey` прокручивает ленту к началу: сразу, если она видна, иначе при показе — поверх
 * прокрутки, которую вернула панель режима.
 *
 * @param resetKey — номер сброса выдачи
 * @returns прокручиваемый элемент, его размеры, прокрутка и её учёт
 */
export const useGridWindow = (resetKey: number): GridWindow => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const [scrollReset] = useState(createScrollReset);
  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useLayoutEffect(() => {
    const element = scrollRef.current;

    scrollReset.request();

    if (element && scrollReset.apply(element)) setScrollTop(0);
  }, [resetKey, scrollReset]);

  useLayoutEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width || 0;

      if (!nextWidth) return;

      scrollReset.apply(element);
      setWidth(nextWidth);
      setViewport(element.clientHeight);
      setScrollTop(element.scrollTop);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [scrollReset]);

  const trackScroll = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;

      const element = scrollRef.current;

      if (element) setScrollTop(element.scrollTop);
    });
  }, []);

  return { scrollRef, width, viewport, scrollTop, trackScroll };
};
