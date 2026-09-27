import type { IndicatorElement, IndicatorTarget } from './tabIndicator.types';

/**
 * Ставит индикатор выбранной вкладки на её место.
 *
 * С переходом индикатор переезжает от прежней вкладки к новой. Мгновенно — при первом замере и
 * показе полосы — стили применяются сразу с выключенным переходом, и только потом переход
 * возвращается: иначе индикатор проехал бы от левого края или от места, где стоял до скрытия.
 * Переход выключается на время одного чтения, а не до следующего кадра: `requestAnimationFrame`
 * из обработчика вне кадра сработал бы до отрисовки, и переход вернулся бы раньше, чем браузер
 * применил новое место.
 *
 * @param indicator — индикатор полосы
 * @param tab — место выбранной вкладки; `null` — выбранной нет, индикатор скрыт
 * @param isInstant — встать на место без перехода
 */
export const placeIndicator = (
  indicator: IndicatorElement,
  tab: IndicatorTarget | null,
  isInstant: boolean
): void => {
  const { style } = indicator;

  if (!tab) {
    style.visibility = 'hidden';

    return;
  }

  if (isInstant) style.transition = 'none';

  style.transform = `translateX(${tab.left}px)`;
  style.width = `${tab.width}px`;
  style.visibility = '';

  if (!isInstant) return;

  if (indicator.offsetWidth >= 0) style.transition = '';
};
