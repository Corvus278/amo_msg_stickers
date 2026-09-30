import type { PreviewState } from '../PreviewProvider.types';

export type PreviewLayerProps = {
  /**
   * Открытый предпросмотр; `null` — слой пуст.
   */
  preview: PreviewState | null;

  /**
   * Закрывает предпросмотр: Escape, клик и уход фокуса.
   */
  onClose: () => void;
};
