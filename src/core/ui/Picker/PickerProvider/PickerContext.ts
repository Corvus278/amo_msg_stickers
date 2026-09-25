import { createContext } from 'preact';

import type { PickerContextValue } from './PickerProvider.types';

/**
 * `null` — значение вне `PickerProvider`: `usePicker` превращает его в исключение.
 */
export const PickerContext = createContext<PickerContextValue | null>(null);
