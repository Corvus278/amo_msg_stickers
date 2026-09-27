import { createContext } from 'preact';

/**
 * Закрытие меню с возвратом фокуса на источник — для пунктов меню. `null` — пункт вне `Menu`.
 */
export const MenuContext = createContext<(() => void) | null>(null);
