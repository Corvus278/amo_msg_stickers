import { useContext } from 'preact/hooks';

import { PickerViewContext } from './PickerViewContext';
import type { PickerViewValue } from './usePickerView.types';

/**
 * Режим, экран поверх него и якорь ленты стикеров. Выбор переживает закрытие и повторное
 * открытие пикера, режим — ещё и перезагрузку страницы.
 *
 * @returns состояние вида и его методы
 */
export const usePickerView = (): PickerViewValue => {
  const value = useContext(PickerViewContext);

  if (!value) throw new Error('usePickerView вызван вне PickerProvider');

  return value;
};
