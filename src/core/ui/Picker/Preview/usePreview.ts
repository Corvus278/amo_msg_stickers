import { useContext } from 'preact/hooks';

import { PreviewContext } from './PreviewContext';
import type { PreviewContextValue } from './PreviewProvider.types';

/**
 * Предпросмотр стикера или GIF: открытие на время удержания, закреплённое открытие и
 * закрытие.
 *
 * @returns значение `PreviewProvider`
 */
export const usePreview = (): PreviewContextValue => {
  const value = useContext(PreviewContext);

  if (!value) throw new Error('usePreview вызван вне PreviewProvider');

  return value;
};
