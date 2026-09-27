import type { MenuPoint } from '../menuPosition/menuPosition.types';

export type MenuState = {
  /**
   * Сдвиг меню от начала его блока позиционирования; `null` — меню ещё не измерено и скрыто.
   */
  offset: MenuPoint | null;

  /**
   * Закрывает меню и возвращает фокус на источник.
   */
  close: () => void;
};
