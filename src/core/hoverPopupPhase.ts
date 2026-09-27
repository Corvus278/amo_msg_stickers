import { scheduleTimeout } from './hoverPopup';
import type { PanelPhase, PanelPhaseOptions, PanelPhaseState } from './hoverPopup.types';

const NO_TIMER = () => {};

/**
 * Фаза панели попапа с анимацией ухода: закрытая панель сначала остаётся видимой в фазе
 * `closing` (класс ухода проигрывает переход), и только по таймеру скрывается совсем.
 * Повторное открытие во время ухода отменяет таймер — панель возвращается из текущего
 * положения перехода, без скрытия и повторного появления.
 *
 * Конец ухода — по таймеру, а не по `transitionend`: перехода может не быть вовсе
 * (панель уже прозрачна, анимации выключены), и тогда событие не придёт.
 *
 * @param options — длительность ухода, колбэк смены фазы и планировщик таймеров
 * @returns текущая фаза, показ и уход
 */
export const createPanelPhase = (options: PanelPhaseOptions): PanelPhaseState => {
  const { closeDuration, onChange } = options;
  const schedule = options.schedule || scheduleTimeout;

  let phase: PanelPhase = 'closed';
  let cancelHide = NO_TIMER;

  const change = (nextPhase: PanelPhase) => {
    phase = nextPhase;
    onChange(nextPhase);
  };

  const show = () => {
    if (phase === 'open') return;
    cancelHide();
    cancelHide = NO_TIMER;
    change('open');
  };

  const hide = () => {
    if (phase !== 'open') return;
    cancelHide = schedule(() => {
      cancelHide = NO_TIMER;
      change('closed');
    }, closeDuration);
    change('closing');
  };

  return {
    get phase() {
      return phase;
    },
    show,
    hide,
  };
};
