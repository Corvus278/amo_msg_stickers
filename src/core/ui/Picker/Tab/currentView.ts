import type { Pack } from '../../../db.types';
import { sectionView } from '../StickersMode/sectionView';
import type { PickerViewValue, View } from '../usePickerView/usePickerView.types';

const GIFS_VIEW: View = { kind: 'gifs' };

/**
 * Открытое представление: экран поверх режима, выдача GIF или раздел ленты стикеров.
 *
 * @param pickerView — состояние вида
 * @param packs — паки библиотеки
 * @returns представление, вкладка которого выбрана
 */
export const currentView = (pickerView: PickerViewValue, packs: Pack[]): View => {
  const { mode, screen, anchor } = pickerView;

  if (screen) return { kind: screen };

  switch (mode) {
    case 'gifs': {
      return GIFS_VIEW;
    }

    case 'stickers': {
      return sectionView(anchor, packs);
    }

    default: {
      const unknownMode: never = mode;

      throw new Error(`Unknown picker mode: ${String(unknownMode)}`);
    }
  }
};
