import { useEffect, useMemo, useRef } from 'preact/hooks';

import { buildStickerLayout, visibleRows } from '../../stickerLayout/stickerLayout';
import type { RowRange } from '../../stickerLayout/stickerLayout.types';
import { usePickerView } from '../../usePickerView/usePickerView';
import { useScrollArea } from '../../useScrollArea/useScrollArea';
import { anchorTop } from '../anchorTop/anchorTop';
import { feedActiveSection } from '../feedActiveSection/feedActiveSection';
import type { FeedSection } from '../feedSections/feedSections.types';

import type { FeedWindow } from './useFeedWindow.types';

const EMPTY_RANGE: RowRange = [0, 0];

/**
 * Виртуальное окно ленты стикеров: в документе только ряды видимой области и по высоте области
 * запаса сверху и снизу — стикеры вне экрана не декодируются и не проигрываются.
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
  const { scrollRef, width, viewport, scrollTop, trackScroll, syncScroll } =
    useScrollArea();
  const appliedSeqRef = useRef(0);
  const layout = useMemo(() => {
    return width && sections ? buildStickerLayout(sections, width) : null;
  }, [sections, width]);
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
    syncScroll();
  }, [anchor, layout, isCurrent, scrollRef, syncScroll]);

  return { scrollRef, layout, range, activeId, trackScroll };
};
