import { useCallback, useEffect, useRef } from 'preact/hooks';

import type { FocusTarget } from '../removalFocus/removalFocus.types';

import type { ExpectRemoval, FocusElement, PendingFocus } from './useRemovalFocus.types';

/**
 * Можно ли забрать фокус: он потерян — ушёл в `body` вместе с удалённым источником, — или
 * остался в пикере. Во втором случае он стоит на узле, который Preact отдал под соседний
 * раздел или ячейку, а не там, куда его ставит удаление.
 *
 * Для документа фокус в shadow root пикера — это его хост, поэтому «в пикере» — непустой
 * `activeElement` корня.
 *
 * @param element — элемент, на который встанет фокус
 * @returns `false` — фокус уже снаружи пикера, в поле ввода amo или ещё где-то на странице
 */
const canMoveFocus = (element: HTMLElement): boolean => {
  const { activeElement, body } = element.ownerDocument;

  if (!activeElement || activeElement === body) return true;

  const root = element.getRootNode();

  return root instanceof ShadowRoot && Boolean(root.activeElement);
};

/**
 * Фокус после удаления из ленты. Источник меню удаления исчезает вместе с удалённым, и без
 * перевода фокус упал бы в `body` — клавиатура потеряла бы место в ленте.
 *
 * Фокус не забирается у страницы: пока лента перечитывалась, пользователь мог уйти в поле
 * ввода amo. По той же причине ожидание сбрасывается при закрытии пикера: удаление, которое не
 * удалось, не должно увести фокус при следующем открытии.
 *
 * @param feed — лента; `null` — ещё не прочитана. Новый объект — лента перечитана
 * @param isOpen — открыт ли пикер
 * @param focusElement — элемент для фокуса по целям и перечитанной ленте; ссылка стабильна
 * @returns запоминание целей фокуса перед удалением
 */
export const useRemovalFocus = <T>(
  feed: T | null,
  isOpen: boolean,
  focusElement: FocusElement<T>
): ExpectRemoval => {
  const pendingRef = useRef<PendingFocus<T> | null>(null);

  const expectRemoval = useCallback(
    (targets: FocusTarget[]) => {
      pendingRef.current = feed ? { targets, feed } : null;
    },
    [feed]
  );

  useEffect(() => {
    if (!isOpen) pendingRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    const pending = pendingRef.current;

    if (!pending || !feed || feed === pending.feed) return;

    pendingRef.current = null;

    const element = focusElement(pending.targets, feed);

    if (element && canMoveFocus(element)) element.focus({ preventScroll: true });
  }, [feed, focusElement]);

  return expectRemoval;
};
