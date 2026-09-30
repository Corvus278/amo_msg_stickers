import type { TargetedPointerEvent } from 'preact';

/**
 * Параметры хука удержания на ячейке.
 */
export type UsePressPreviewOptions = {
  /**
   * Удержание состоялось; получает кнопку ячейки, с которой открывается предпросмотр.
   */
  onHold: (source: HTMLElement) => void;

  /**
   * Указатель с зажатой основной кнопкой вошёл на ячейку: предпросмотр, открытый удержанием,
   * должен показать её; получает кнопку этой ячейки.
   */
  onSwap: (source: HTMLElement) => void;

  /**
   * Ячейка занята (идёт отправка): удержание не запускается.
   */
  isDisabled: boolean;
};

/**
 * Обработчики указателя для кнопки ячейки.
 */
export type PressPreviewHandlers = {
  /**
   * Нажатие: запускает отсчёт удержания.
   */
  onPointerDown: (event: TargetedPointerEvent<HTMLElement>) => void;

  /**
   * Вход указателя на ячейку при зажатой кнопке переключает предпросмотр на неё.
   */
  onPointerEnter: (event: TargetedPointerEvent<HTMLElement>) => void;

  /**
   * Движение: сдвиг дальше порога отменяет удержание.
   */
  onPointerMove: (event: TargetedPointerEvent<HTMLElement>) => void;

  /**
   * Уход указателя с ячейки отменяет удержание.
   */
  onPointerLeave: () => void;

  /**
   * Отпускание до срока отменяет удержание.
   */
  onPointerUp: () => void;

  /**
   * Отмена жеста браузером отменяет удержание.
   */
  onPointerCancel: () => void;
};
