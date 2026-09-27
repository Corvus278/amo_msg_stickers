import type { PanelPhase } from '../../hoverPopup.types';

export type PickerProps = {
  /**
   * Фаза панели: открытая, уходящая анимацией закрытия или скрытая. Скрытая остаётся в
   * дереве и сохраняет состояние.
   */
  phase: PanelPhase;

  /**
   * Тёмная тема страницы.
   */
  isDark: boolean;

  /**
   * Колбэк на закрытие пикера изнутри — по Escape.
   */
  onClose: () => void;
};
