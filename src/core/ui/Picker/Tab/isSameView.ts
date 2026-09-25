import type { View } from '../usePickerView/usePickerView.types';

/**
 * Одно ли это представление: у паков сравнивается ещё и пак — вкладки разных паков
 * одного вида.
 *
 * @param view — представление вкладки
 * @param current — открытое представление
 * @returns открыто ли представление вкладки
 */
export const isSameView = (view: View, current: View) => {
  if (view.kind === 'pack' && current.kind === 'pack') {
    return view.packId === current.packId;
  }

  return view.kind === current.kind;
};
