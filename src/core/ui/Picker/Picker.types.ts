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
   * Корень слоя предпросмотра на странице: оверлей рисуется в него, вне панели.
   */
  previewRoot: ShadowRoot;

  /**
   * Колбэк на закрытие пикера изнутри — по Escape.
   */
  onClose: () => void;
};
