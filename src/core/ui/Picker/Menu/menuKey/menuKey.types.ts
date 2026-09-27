/**
 * Срез события `keydown`, по которому узнаётся клавиша меню.
 */
export type MenuKeyEvent = {
  /**
   * Значение клавиши.
   */
  key: string;

  /**
   * Зажат ли Shift.
   */
  shiftKey: boolean;

  /**
   * Зажат ли Ctrl.
   */
  ctrlKey: boolean;

  /**
   * Зажат ли Alt (Option).
   */
  altKey: boolean;

  /**
   * Зажат ли Meta (Cmd).
   */
  metaKey: boolean;
};
