import type { RefObject } from 'preact';

/**
 * Колбэк на замер видимой ленты.
 */
export type ScrollMeasureCallback = (element: HTMLDivElement) => void;

export type ScrollArea = {
  /**
   * Прокручиваемый элемент ленты.
   */
  scrollRef: RefObject<HTMLDivElement>;

  /**
   * Ширина содержимого ленты без отступов и полосы прокрутки; 0 — ещё не известна.
   */
  width: number;

  /**
   * Высота видимой области ленты.
   */
  viewport: number;

  /**
   * Прокрутка ленты в пикселях.
   */
  scrollTop: number;

  /**
   * Сообщает о прокрутке ленты: прокрутка перечитывается не чаще кадра.
   */
  trackScroll: () => void;

  /**
   * Перечитывает прокрутку сразу — после того как её поставил код, а не пользователь.
   */
  syncScroll: () => void;
};
