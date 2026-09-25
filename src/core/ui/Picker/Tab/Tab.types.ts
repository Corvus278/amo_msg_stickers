import type { ComponentChildren } from 'preact';

import type { View } from '../usePickerView/usePickerView.types';

export type TabProps = {
  /**
   * Подсказка вкладки — она же её доступное имя, когда внутри иконка.
   */
  title: string;

  /**
   * Представление, которое открывает вкладка; вкладка выбрана, пока оно открыто.
   */
  view: View;

  /**
   * Содержимое вкладки: иконка, обложка пака или короткая подпись.
   */
  children: ComponentChildren;
};
