import type { FocusTarget } from '../removalFocus/removalFocus.types';

/**
 * Ожидание перечитанной ленты после удаления.
 */
export type PendingFocus<T> = {
  /**
   * Цели фокуса по убыванию предпочтения.
   */
  targets: FocusTarget[];

  /**
   * Лента до удаления: цели применяются к первой ленте, отличной от неё.
   */
  feed: T;
};

/**
 * Запоминает цели фокуса перед удалением; фокус переходит на первую уцелевшую цель, когда
 * лента перечитана.
 */
export type ExpectRemoval = (targets: FocusTarget[]) => void;

/**
 * Элемент для фокуса по целям и перечитанной ленте; `null` — фокус не переводится.
 */
export type FocusElement<T> = (targets: FocusTarget[], feed: T) => HTMLElement | null;
