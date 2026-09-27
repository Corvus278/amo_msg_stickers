import { useCallback, useLayoutEffect, useRef, useState } from 'preact/hooks';

import type { ScrollArea, ScrollMeasureCallback } from './useScrollArea.types';

/**
 * Размеры и прокрутка ленты для виртуального окна.
 *
 * Размеры снимает `ResizeObserver`: так в ширину не попадает полоса прокрутки Windows, а показ
 * скрытой панели (попап открылся, режим переключился) заново читает размеры и прокрутку, которую
 * скрытие `display: none` сбросило и панель вернула. Скрытая панель с нулевой шириной размеры не
 * перезаписывает — иначе лента на время скрытия теряла бы раскладку и при показе мигала пустой.
 *
 * @param onMeasure — колбэк на замер видимой ленты до чтения прокрутки: лента может поставить
 * свою прокрутку поверх возвращённой панелью; должен быть стабильным
 * @returns прокручиваемый элемент, его размеры, прокрутка и её учёт
 */
export const useScrollArea = (onMeasure?: ScrollMeasureCallback): ScrollArea => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useLayoutEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width || 0;

      if (!nextWidth) return;

      onMeasure?.(element);
      setWidth(nextWidth);
      setViewport(element.clientHeight);
      setScrollTop(element.scrollTop);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [onMeasure]);

  const syncScroll = useCallback(() => {
    const element = scrollRef.current;

    if (element) setScrollTop(element.scrollTop);
  }, []);

  const trackScroll = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      syncScroll();
    });
  }, [syncScroll]);

  return { scrollRef, width, viewport, scrollTop, trackScroll, syncScroll };
};
