import type { View } from '../usePickerView/usePickerView.types';

/**
 * Панель у вкладок одна: представление меняется внутри неё, поэтому все вкладки
 * управляют одним и тем же элементом.
 */
export const TAB_PANEL_ID = 'picker-tabpanel';

/**
 * id вкладки представления — для `aria-labelledby` панели. Пикер живёт в своём shadow
 * root, и с id страницы amo они не пересекаются.
 *
 * @param view — представление вкладки
 * @returns id, уникальный среди вкладок: у паков в него входит id пака
 */
export const tabId = (view: View): string => {
  return view.kind === 'pack'
    ? `picker-tab-pack-${view.packId}`
    : `picker-tab-${view.kind}`;
};
