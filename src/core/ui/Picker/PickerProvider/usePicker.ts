import { useContext } from 'preact/hooks';

import { PickerContext } from './PickerContext';
import type { PickerContextValue } from './PickerProvider.types';

/**
 * Общее состояние пикера: окружение, настройки, паки, статус, отправка и кэш object URL.
 *
 * @returns значение `PickerProvider`
 */
export const usePicker = (): PickerContextValue => {
  const value = useContext(PickerContext);

  if (!value) throw new Error('usePicker вызван вне PickerProvider');

  return value;
};
