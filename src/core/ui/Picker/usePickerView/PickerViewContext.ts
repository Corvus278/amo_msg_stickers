import { createContext } from 'preact';

import type { PickerViewValue } from './usePickerView.types';

/**
 * `null` — значение вне `PickerProvider`: `usePickerView` превращает его в исключение.
 */
export const PickerViewContext = createContext<PickerViewValue | null>(null);
