import type { ComponentChildren } from 'preact';

import type { PanelPhase } from '../../../hoverPopup.types';

/**
 * Что показывает предпросмотр.
 */
export type PreviewTarget = {
  /**
   * Адрес картинки, которая уходит при отправке: версия стикера или GIF для отправки.
   */
  url: string;

  /**
   * Адрес облегчённого превью GIF; стоит на месте, пока грузится `url`. У стикера нет.
   */
  previewUrl?: string;

  /**
   * Эмодзи стикера: показывается над картинкой. У стикера без эмодзи и у GIF его нет.
   */
  emoji?: string | undefined;

  /**
   * Имя для скринридера: целая фраза словаря `CellNames.preview`.
   */
  name: string;
};

/**
 * Как открыт предпросмотр: `hold` живёт, пока держат кнопку мыши, `pinned` — пока его не
 * закроют.
 */
export type PreviewMode = 'hold' | 'pinned';

/**
 * Открытый предпросмотр.
 */
export type PreviewState = {
  /**
   * Что показывать.
   */
  target: PreviewTarget;

  /**
   * Способ открытия.
   */
  mode: PreviewMode;

  /**
   * Элемент, из которого открыт предпросмотр: на него возвращается фокус при закрытии.
   */
  source: HTMLElement;

  /**
   * Предпросмотр закрыт и слой доигрывает уход (картинка возвращается в ячейку). По смыслу он
   * уже закрыт: удержание попапа снято, открыть или переключить его нельзя, слой курсор и фокус
   * не принимает.
   */
  isLeaving: boolean;
};

export type PreviewContextValue = {
  /**
   * Открытый предпросмотр; `null` — закрыт.
   */
  preview: PreviewState | null;

  /**
   * Открывает предпросмотр на время удержания кнопки.
   */
  openHold: (target: PreviewTarget, source: HTMLElement) => void;

  /**
   * Переключает предпросмотр, открытый удержанием, на другую ячейку: указатель с зажатой
   * кнопкой вошёл на неё. Закрытый и закреплённый предпросмотр не меняется.
   */
  swapHold: (target: PreviewTarget, source: HTMLElement) => void;

  /**
   * Открывает закреплённый предпросмотр.
   */
  openPinned: (target: PreviewTarget, source: HTMLElement) => void;

  /**
   * Закрывает предпросмотр: слой доигрывает уход, а не пропадает сразу. Закрытый и уже
   * уходящий предпросмотр остаётся как есть.
   */
  close: () => void;

  /**
   * Уход доигран: снимает слой. Состояние снимается, только если оно всё ещё то, что слой
   * уводил, — уход, отменённый повторным открытием, нового предпросмотра не закроет.
   */
  finishLeave: (leaving: PreviewState) => void;
};

export type PreviewProviderProps = {
  /**
   * Фаза панели: закрытая панель закрывает предпросмотр.
   */
  phase: PanelPhase;

  /**
   * Дерево панели, в котором работает `usePreview`.
   */
  children: ComponentChildren;
};
