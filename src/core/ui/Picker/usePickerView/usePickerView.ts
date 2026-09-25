import { useContext } from 'preact/hooks';

import { PickerViewContext } from './PickerViewContext';
import type { PickerViewValue } from './usePickerView.types';

/**
 * Открытое представление пикера и переключение между представлениями. Выбор
 * переживает закрытие и повторное открытие пикера.
 *
 * @returns открытое представление и `switchTo`
 */
export const usePickerView = (): PickerViewValue => {
  const value = useContext(PickerViewContext);

  if (!value) throw new Error('usePickerView вызван вне PickerProvider');

  return value;
};
