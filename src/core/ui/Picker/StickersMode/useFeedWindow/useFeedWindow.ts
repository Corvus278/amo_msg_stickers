import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { buildStickerLayout, visibleRows } from '../../stickerLayout/stickerLayout';
import type { RowRange } from '../../stickerLayout/stickerLayout.types';
import { usePickerView } from '../../usePickerView/usePickerView';
import { anchorTop } from '../anchorTop/anchorTop';
import { feedActiveSection } from '../feedActiveSection/feedActiveSection';
import type { FeedSection } from '../feedSections/feedSections.types';

import type { FeedBox, FeedWindow } from './useFeedWindow.types';

const EMPTY_RANGE: RowRange = [0, 0];

/**
 * Виртуальное окно ленты стикеров: в документе только ряды видимой области и по высоте области
 * запаса сверху и снизу — стикеры вне экрана не декодируются и не проигрываются.
 *
 * Размеры снимает `ResizeObserver`: так в ширину не попадает полоса прокрутки Windows, а показ
 * скрытой панели (попап открылся, режим переключился) заново читает размеры и прокрутку, которую
 * скрытие `display: none` сбросило. Скрытая панель с нулевой шириной размеры не перезаписывает.
 *
 * Запрос `scrollToSection` ставит заголовок раздела вверх ленты. Раздела ещё нет или разделы
 * прочитаны для прежнего списка паков (импорт позвал переход сразу после `refreshPacks`) —
 * запрос ждёт перечитывания и исполняется по свежей раскладке.
 * Прокрутка ставится в эффекте, а не в layout-эффекте: панель режима возвращает запомненную
 * прокрутку в своём layout-эффекте, который идёт после эффектов детей, и перетёрла бы переход.
 *
 * @param sections — разделы ленты; `null` — ещё не прочитаны
 * @param isCurrent — разделы прочитаны для текущего списка паков
 * @returns окно рядов, активный раздел и учёт прокрутки
 */
export const useFeedWindow = (
  sections: FeedSection[] | null,
  isCurrent: boolean
): FeedWindow => {
  const { anchor } = usePickerView();
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const appliedSeqRef = useRef(0);
  const [box, setBox] = useState<FeedBox | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useLayoutEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width || 0;

      if (!width) return;

      setBox({ width, height: element.clientHeight });
      setScrollTop(element.scrollTop);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const width = box?.width || 0;
  const layout = useMemo(() => {
    return width && sections ? buildStickerLayout(sections, width) : null;
  }, [sections, width]);
  const viewport = box?.height || 0;
  const range = layout
    ? visibleRows(layout.rows, scrollTop, viewport, viewport)
    : EMPTY_RANGE;
  const activeId = layout ? feedActiveSection(layout, scrollTop, viewport) : null;

  useEffect(() => {
    const element = scrollRef.current;

    const top = anchorTop({
      anchor,
      appliedSeq: appliedSeqRef.current,
      layout,
      isCurrent,
    });

    if (!anchor || !element || top === null) return;

    appliedSeqRef.current = anchor.seq;
    element.scrollTop = top;
    setScrollTop(element.scrollTop);
  }, [anchor, layout, isCurrent]);

  const trackScroll = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;

      const element = scrollRef.current;

      if (element) setScrollTop(element.scrollTop);
    });
  }, []);

  return { scrollRef, layout, range, activeId, trackScroll };
};
