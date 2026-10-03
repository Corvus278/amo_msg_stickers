import { createContext } from 'preact';

import type { PreviewContextValue } from './PreviewProvider.types';

/**
 * `null` — значение вне `PreviewProvider`: `usePreview` превращает его в исключение.
 */
export const PreviewContext = createContext<PreviewContextValue | null>(null);
