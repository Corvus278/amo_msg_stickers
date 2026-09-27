import type { HoverPopup, HoverPopupOptions, ScheduleTimer } from './hoverPopup.types';

/**
 * Состояние попапа: закрыт, открыт наведением (закроется уходом курсора) или закреплён
 * кликом (уход курсора его не закрывает).
 */
type PopupState = 'closed' | 'hover' | 'pinned';

/**
 * Планировщик по умолчанию для модулей попапа — настоящие таймеры страницы.
 *
 * @param callback — что вызвать
 * @param ms — через сколько миллисекунд
 * @returns отмена таймера
 */
export const scheduleTimeout: ScheduleTimer = (callback, ms) => {
  const id = setTimeout(callback, ms);

  return () => {
    clearTimeout(id);
  };
};

const NO_TIMER = () => {};

const NOT_LEAVING = () => {
  return false;
};

/**
 * Контроллер открытия попапа наведением и кликом без DOM: вызывающая сторона переводит события
 * курсора в `enter` / `leave` / `click` / `dismiss`, контроллер решает, когда звать `onOpen` и
 * `onClose`. Таймеры — через `schedule`, поэтому контроллер проверяется на фейковых таймерах.
 *
 * `isHeld` спрашивается в момент срабатывания таймера закрытия, а не при уходе: удержание
 * (фокус в поле ввода, диалог файла) может начаться уже после ухода курсора. Удержанный
 * попап остаётся открытым наведением — следующий уход курсора снова запустит закрытие.
 *
 * @param options — задержки, колбэки и планировщик таймеров
 * @returns обработчики событий и признак открытого попапа
 */
export const createHoverPopup = (options: HoverPopupOptions): HoverPopup => {
  const { openDelay, closeDelay, onOpen, onClose, isHeld } = options;
  const schedule = options.schedule || scheduleTimeout;
  const isLeaving = options.isLeaving || NOT_LEAVING;

  let state: PopupState = 'closed';
  let cancelOpen: (() => void) | null = null;
  let cancelClose: (() => void) | null = null;

  const clearOpen = () => {
    (cancelOpen || NO_TIMER)();
    cancelOpen = null;
  };

  const clearClose = () => {
    (cancelClose || NO_TIMER)();
    cancelClose = null;
  };

  const open = (nextState: 'hover' | 'pinned') => {
    clearOpen();
    clearClose();
    state = nextState;
    onOpen(nextState === 'pinned' ? 'click' : 'hover');
  };

  const dismiss = () => {
    clearOpen();
    clearClose();

    if (state === 'closed') return;
    /**
     * Состояние меняется до колбэка: `onClose` может закрыть попап снаружи и позвать
     * `dismiss` ещё раз — второго закрытия не будет.
     */
    state = 'closed';
    onClose();
  };

  const enter = () => {
    clearClose();

    if (state !== 'closed' || cancelOpen) return;

    if (isLeaving()) {
      open('hover');

      return;
    }

    cancelOpen = schedule(() => {
      cancelOpen = null;
      open('hover');
    }, openDelay);
  };

  const leave = () => {
    clearOpen();

    /**
     * Уже идущая задержка не продлевается: уход за окно приходит вдогонку уходу с кнопки.
     */
    if (state !== 'hover' || cancelClose) return;
    cancelClose = schedule(() => {
      cancelClose = null;

      if (!isHeld()) dismiss();
    }, closeDelay);
  };

  const click = () => {
    switch (state) {
      case 'closed': {
        open('pinned');

        return;
      }

      /**
       * Попап уже открыт — `onOpen` второй раз не зовётся, клик только закрепляет его.
       */
      case 'hover': {
        clearClose();
        state = 'pinned';

        return;
      }

      case 'pinned': {
        dismiss();

        return;
      }

      default: {
        const unknownState: never = state;

        throw new Error(`Unknown popup state: ${String(unknownState)}`);
      }
    }
  };

  return {
    enter,
    leave,
    click,
    dismiss,
    get isOpen() {
      return state !== 'closed';
    },
  };
};
