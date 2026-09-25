import type { ComponentChildren } from 'preact';

export type ViewHeaderProps = {
  /**
   * Содержимое шапки: `ViewTitle`, поле поиска, чипы. Без него шапка пустая, но место под
   * неё остаётся.
   */
  children?: ComponentChildren;
};
