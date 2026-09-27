import { createContext } from 'preact';

import type { MenuCloser } from './MenuContext.types';

/**
 * Закрытие меню с возвратом фокуса на источник — для пунктов меню. `null` — пункт вне `Menu`.
 */
export const MenuContext = createContext<MenuCloser | null>(null);
