import { CUSTOM_PACK_ID } from '../../../../db';
import { RECENT_SECTION_ID } from '../../usePickerView/sectionIds';

import type { HeaderAction } from './headerAction.types';

/**
 * Действие заголовка раздела. У «Моих стикеров» его нет: пак своих стикеров не удаляется, а
 * меню без пунктов в заголовке было бы пустым.
 *
 * @param sectionId — id раздела: `recent` или id пака
 * @returns действие заголовка; `null` — заголовок без действий
 */
export const headerAction = (sectionId: string): HeaderAction | null => {
  switch (sectionId) {
    case RECENT_SECTION_ID: {
      return 'clear';
    }

    case CUSTOM_PACK_ID: {
      return null;
    }

    default: {
      return 'menu';
    }
  }
};
