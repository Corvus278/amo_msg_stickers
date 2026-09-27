import type { HoldReason, PopupHolds } from './hoverPopup.types';

/**
 * Причины, которые пишет DOM панели: у скрытой панели их некому снять.
 */
const PANEL_REASONS: HoldReason[] = ['field', 'fileDialog'];

/**
 * Общий объект удержания попапа: фасад пикера отдаёт `isHeld` контроллеру наведения, а
 * провайдер и панель пишут в него причины. `isHeld` читается в момент срабатывания таймера
 * закрытия, поэтому подписки на изменения нет.
 *
 * @returns запись причин и проверка удержания
 */
export const createPopupHolds = (): PopupHolds => {
  const active = new Set<HoldReason>();

  const set = (reason: HoldReason, isActive: boolean) => {
    if (isActive) {
      active.add(reason);

      return;
    }

    active.delete(reason);
  };

  const isHeld = () => {
    return active.size > 0;
  };

  const releasePanel = () => {
    for (const reason of PANEL_REASONS) active.delete(reason);
  };

  return { set, isHeld, releasePanel };
};
