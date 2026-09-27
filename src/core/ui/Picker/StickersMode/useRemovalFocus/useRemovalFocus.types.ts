import type { FeedSection } from '../feedSections/feedSections.types';
import type { FocusTarget } from '../removalFocus/removalFocus.types';

/**
 * Ожидание перечитанной ленты после удаления.
 */
export type PendingFocus = {
  /**
   * Цели фокуса по убыванию предпочтения.
   */
  targets: FocusTarget[];

  /**
   * Разделы ленты до удаления: цели применяются к первым разделам, отличным от них.
   */
  sections: FeedSection[];
};

/**
 * Запоминает цели фокуса перед удалением; фокус переходит на первую уцелевшую цель, когда
 * лента перечитана.
 */
export type ExpectRemoval = (targets: FocusTarget[]) => void;
