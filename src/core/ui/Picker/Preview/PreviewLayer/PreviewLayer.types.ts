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

  /**
   * Уход доигран: слой зовёт с тем состоянием, которое уводил, и провайдер его снимает.
   */
  onLeaveEnd: (leaving: PreviewState) => void;
};
