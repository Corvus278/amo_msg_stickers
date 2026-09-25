import type { ComponentChildren, TargetedEvent } from 'preact';

import type { View } from '../usePickerView/usePickerView.types';

export type ViewBodyProps = {
  /**
   * Представление, которому принадлежит тело: из него берутся метки `data-view` и
   * `data-pack-id` для проверки переключения на стенде.
   */
  view: View;

  /**
   * Содержимое представления.
   */
  children: ComponentChildren;

  /**
   * Колбэк на прокрутку тела.
   */
  onScroll?: (event: TargetedEvent<HTMLDivElement>) => void;
};
