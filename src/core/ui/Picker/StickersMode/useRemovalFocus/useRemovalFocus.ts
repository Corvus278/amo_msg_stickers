import type { RefObject } from 'preact';
import { useCallback, useEffect, useRef } from 'preact/hooks';

import { sectionTabId } from '../../SectionTabs/sectionTabIds';
import { cellId } from '../../StickerFeed/cellId';
import type { FeedSection } from '../feedSections/feedSections.types';
import { resolveFocusTarget } from '../removalFocus/removalFocus';
import type { FocusTarget } from '../removalFocus/removalFocus.types';

import type { ExpectRemoval, PendingFocus } from './useRemovalFocus.types';

/**
 * Элемент цели в shadow root пикера. Ячейка могла не попасть в окно ленты — тогда фокус
 * уходит на вкладку её раздела: полоса вкладок в документе целиком.
 *
 * @param root — shadow root пикера или документ
 * @param target — цель фокуса
 * @returns элемент для фокуса; `null` — его нет в документе
 */
const targetElement = (
  root: DocumentFragment | Document,
  target: FocusTarget
): HTMLElement | null => {
  const { kind, sectionId } = target;
  const tab = root.getElementById(sectionTabId(sectionId));

  switch (kind) {
    case 'cell': {
      return root.getElementById(cellId(sectionId, target.key)) || tab;
    }

    case 'tab': {
      return tab;
    }

    default: {
      const unknownKind: never = kind;

      throw new Error(`Unknown focus target: ${String(unknownKind)}`);
    }
  }
};

/**
 * Фокус после удаления ячейки или раздела ленты. Источник меню удаления исчезает вместе с
 * удалённым, и без перевода фокус упал бы в `body` — клавиатура потеряла бы место в ленте.
 *
 * Фокус переводится, только если он действительно потерян: пока лента перечитывалась,
 * пользователь мог уйти в поле ввода amo, и забирать фокус оттуда нельзя. По той же причине
 * ожидание сбрасывается при закрытии пикера: удаление, которое не удалось, не должно увести
 * фокус при следующем открытии.
 *
 * @param sections — разделы ленты; `null` — библиотека ещё не прочитана
 * @param scrollRef — прокручиваемый элемент ленты: от него ищется shadow root пикера
 * @param isOpen — открыт ли пикер
 * @returns запоминание целей фокуса перед удалением
 */
export const useRemovalFocus = (
  sections: FeedSection[] | null,
  scrollRef: RefObject<HTMLElement>,
  isOpen: boolean
): ExpectRemoval => {
  const pendingRef = useRef<PendingFocus | null>(null);

  const expectRemoval = useCallback(
    (targets: FocusTarget[]) => {
      pendingRef.current = sections && targets.length ? { targets, sections } : null;
    },
    [sections]
  );

  useEffect(() => {
    if (!isOpen) pendingRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    const pending = pendingRef.current;
    const scroller = scrollRef.current;

    if (!pending || !sections || !scroller || sections === pending.sections) return;

    pendingRef.current = null;

    const { activeElement, body } = scroller.ownerDocument;

    if (activeElement && activeElement !== body) return;

    const root = scroller.getRootNode();
    const target = resolveFocusTarget(pending.targets, sections);

    if (!target || !(root instanceof DocumentFragment || root instanceof Document))
      return;

    targetElement(root, target)?.focus({ preventScroll: true });
  }, [sections, scrollRef]);

  return expectRemoval;
};
