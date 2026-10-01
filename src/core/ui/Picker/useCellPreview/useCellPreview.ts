import { usePreview } from '../Preview/usePreview';
import { usePressPreview } from '../usePressPreview/usePressPreview';

import type { CellPreview, UseCellPreviewOptions } from './useCellPreview.types';

/**
 * Предпросмотр ячейки стикера или GIF: удержание кнопки мыши (`usePressPreview`) с открытием и
 * переключением предпросмотра по её цели и закреплённое открытие из меню. Одна обвязка на обе
 * ячейки: стикер и GIF отличаются только целью.
 *
 * @param options — цель предпросмотра и признак занятой ячейки
 * @returns методы удержания и закреплённое открытие
 */
export const useCellPreview = (options: UseCellPreviewOptions): CellPreview => {
  const { target, isBusy } = options;
  const { openHold, swapHold, openPinned } = usePreview();
  const press = usePressPreview({
    isDisabled: isBusy,
    onHold: (source) => {
      openHold(target, source);
    },
    onSwap: (source) => {
      swapHold(target, source);
    },
  });

  const openCellPinned = (source: HTMLElement) => {
    openPinned(target, source);
  };

  return { ...press, openPinned: openCellPinned };
};
