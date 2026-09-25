export type PickerProps = {
  /**
   * Открыт ли пикер: закрытый остаётся в дереве скрытым и сохраняет состояние.
   */
  isOpen: boolean;

  /**
   * Тёмная тема страницы.
   */
  isDark: boolean;

  /**
   * Колбэк на закрытие пикера изнутри — по Escape.
   */
  onClose: () => void;
};
