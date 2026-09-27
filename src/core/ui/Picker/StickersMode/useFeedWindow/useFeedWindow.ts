import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { scrollMotion } from '../../scrollMotion/scrollMotion';
import { buildStickerLayout, visibleRows } from '../../stickerLayout/stickerLayout';
import type { RowRange } from '../../stickerLayout/stickerLayout.types';
import { usePickerView } from '../../usePickerView/usePickerView';
import { useScrollArea } from '../../useScrollArea/useScrollArea';
import { anchorTop } from '../anchorTop/anchorTop';
import { feedActiveSection } from '../feedActiveSection/feedActiveSection';
import type { FeedSection } from '../feedSections/feedSections.types';
import { createScrollLock } from '../scrollLock/scrollLock';
import { sectionScrollPlan } from '../sectionScrollPlan/sectionScrollPlan';
import { wheelDeltaPx } from '../wheelDeltaPx/wheelDeltaPx';

import type { FeedWindow } from './useFeedWindow.types';

const EMPTY_RANGE: RowRange = [0, 0];

/**
 * Тишина прокрутки, после которой плавный переход считается законченным, мс: события плавной
 * прокрутки идут раз в кадр (~16 мс), и без них дольше этого лента уже стоит.
 */
const SCROLL_QUIET_MS = 150;

/**
 * Ввод пользователя на ленте, который прерывает плавный переход к разделу: колесо, касание,
 * нажатие (в том числе на полосу прокрутки) и клавиатура.
 *
 * Колесо слушается не пассивно: шаг колеса, который прервал переход, слушатель отменяет и
 * делает сам. Слушатели стоят только на время перехода — в остальное время колесо ленты не
 * ждёт главный поток.
 */
const INTERRUPT_EVENTS = [
  ['wheel', false],
  ['touchstart', true],
  ['pointerdown', true],
  ['keydown', true],
] as const;

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
 * Переход по вкладке (`'smooth'`) едет плавно, а к разделу дальше видимой области сначала
 * мгновенно встаёт на экран от него (`sectionScrollPlan`): иначе проезд провёл бы окно рядов
 * через все промежуточные паки. Пока лента едет, выбранной остаётся нажатая вкладка, а не
 * разделы, мимо которых идёт прокрутка; колесо, касание, нажатие или клавиша на ленте снимают
 * удержание, и выбранная снова считается по прокрутке. При уменьшении движения в системе и для
 * `'instant'` раздел ставится сразу.
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
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [lock] = useState(() => {
    return createScrollLock({ quietMs: SCROLL_QUIET_MS, onChange: setLockedId });
  });
  const layout = useMemo(() => {
    return width && sections ? buildStickerLayout(sections, width) : null;
  }, [sections, width]);
  const range = layout
    ? visibleRows(layout.rows, scrollTop, viewport, viewport)
    : EMPTY_RANGE;
  const scrolledId = layout ? feedActiveSection(layout, scrollTop, viewport) : null;
  const activeId = lockedId || scrolledId;
  const isLocked = lockedId !== null;

  useEffect(() => {
    return () => {
      lock.dispose();
    };
  }, [lock]);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element || !isLocked) return;

    /**
     * Удержание есть — лента ещё едет к разделу. Chrome не обрывает плавную программную
     * прокрутку вводом пользователя: без мгновенной остановки лента доехала бы до раздела
     * поверх колеса, касания и клавиш.
     *
     * Шаг колеса, который прервал переход, лента делает сама, а родную прокрутку колесом
     * отменяет: Chrome вливает его в ещё живую программную прокрутку, и остановка на месте
     * съедала бы его. Дальше колесо прокручивает ленту само — слушатели снимаются вместе с
     * удержанием. Колесо с Ctrl — масштаб страницы, а не прокрутка: его не отменяем.
     */
    const handleUserInput = (event: Event) => {
      if (lock.current() === null) return;

      lock.interrupt();

      if (event instanceof WheelEvent && !event.ctrlKey) {
        event.preventDefault();
        element.scrollTo({
          top:
            element.scrollTop +
            wheelDeltaPx({
              delta: event.deltaY,
              deltaMode: event.deltaMode,
              pageHeight: element.clientHeight,
            }),
          behavior: scrollMotion(),
        });

        return;
      }

      element.scrollTo({ top: element.scrollTop, behavior: 'instant' });
    };

    for (const [type, isPassive] of INTERRUPT_EVENTS) {
      element.addEventListener(type, handleUserInput, { passive: isPassive });
    }

    return () => {
      for (const [type] of INTERRUPT_EVENTS) {
        element.removeEventListener(type, handleUserInput);
      }
    };
  }, [scrollRef, lock, isLocked]);

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

    if (anchor.motion === 'smooth' && scrollMotion() === 'smooth') {
      const { scrollTop: from, clientHeight, scrollHeight } = element;
      const { jumpTo, target } = sectionScrollPlan({
        from,
        to: top,
        viewport: clientHeight,
        maxScroll: scrollHeight - clientHeight,
      });

      /**
       * Лента уже стоит на цели с точностью до пикселя: событий прокрутки не будет, и удержание
       * только задержало бы подсветку на время тишины.
       */
      if (Math.abs(target - from) >= 1) lock.lock(anchor.sectionId);

      if (jumpTo !== null) element.scrollTop = jumpTo;

      element.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      lock.interrupt();
      element.scrollTop = top;
    }

    syncScroll();
  }, [anchor, layout, isCurrent, scrollRef, syncScroll, lock]);

  const handleScroll = useCallback(() => {
    lock.scroll();
    trackScroll();
  }, [lock, trackScroll]);

  return { scrollRef, layout, range, activeId, trackScroll: handleScroll };
};
