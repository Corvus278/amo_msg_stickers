import type { ComponentChildren } from 'preact';

export type PreviewPortalProps = {
  /**
   * Корень, в который рисуется содержимое: shadow root слоя предпросмотра.
   */
  container: ShadowRoot;

  /**
   * Содержимое слоя. Контекст панели в него не доходит — данные передаются пропсами.
   */
  children: ComponentChildren;
};
