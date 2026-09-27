import type { Pack } from '../../../db.types';
import type { SectionAnchor, View } from '../usePickerView/usePickerView.types';

const RECENT_VIEW: View = { kind: 'recent' };

/**
 * Представление режима «Стикеры» по якорю: пак раздела или недавние. Пак, которого нет среди
 * паков (удалён здесь или в другой вкладке браузера, ещё не прочитан), открывает недавние.
 *
 * @param anchor — последний запрос прокрутки к разделу
 * @param packs — паки библиотеки
 * @returns представление, открытое в режиме «Стикеры»
 */
export const sectionView = (anchor: SectionAnchor | null, packs: Pack[]): View => {
  const pack = anchor
    ? packs.find(({ id }) => {
        return id === anchor.sectionId;
      })
    : undefined;

  return pack ? { kind: 'pack', packId: pack.id } : RECENT_VIEW;
};
