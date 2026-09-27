import type { ComponentChildren } from 'preact';

import type { View } from '../usePickerView/usePickerView.types';

export type ViewBodyProps = {
  /**
   * Экран, которому принадлежит тело: из него берётся метка `data-view` для проверки
   * переключения на стенде.
   */
  view: View;

  /**
   * Содержимое представления.
   */
  children: ComponentChildren;
};
