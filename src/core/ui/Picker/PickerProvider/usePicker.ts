import { useContext } from 'preact/hooks';

import { PickerContext } from './PickerContext';
import type { PickerContextValue } from './PickerProvider.types';

/**
 * Общее состояние пикера: окружение, настройки, паки, статус, отправка, кэш object URL и
 * импорт пака из Telegram.
 *
 * @returns значение `PickerProvider`
 */
export const usePicker = (): PickerContextValue => {
  const value = useContext(PickerContext);

  if (!value) throw new Error('usePicker вызван вне PickerProvider');

  return value;
};
