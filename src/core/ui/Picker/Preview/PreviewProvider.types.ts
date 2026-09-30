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
   * Закрывает предпросмотр; закрытый остаётся закрытым.
   */
  close: () => void;
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
