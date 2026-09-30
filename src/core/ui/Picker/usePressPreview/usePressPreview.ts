import type { TargetedPointerEvent } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';

import { createPressGesture, shouldSwapPreview } from '../pressGesture/pressGesture';

import type {
  PressPreviewHandlers,
  UsePressPreviewOptions,
} from './usePressPreview.types';

/**
 * Удержание основной кнопки на ячейке: по `HOLD_DELAY_MS` зовёт `onHold`. Отпускание после
 * удержания и закрытие предпросмотра здесь не обрабатываются — их держит провайдер
 * предпросмотра на `window`, поэтому ячейка не помнит, что её держали.
 *
 * Вход указателя на другую ячейку при зажатой основной кнопке (`onSwap`) переключает уже
 * открытый предпросмотр без новой задержки: провайдер сам решает, открыт ли он удержанием.
 *
 * Актуальные `onHold`, `onSwap` и `isDisabled` читаются в момент нажатия и срабатывания из ref, так
 * что жест не пересоздаётся при перерисовке ячейки и не теряет отсчёт. Таймер снимается при
 * размонтировании.
 *
 * @param options — колбэки удержания и смены, признак занятой ячейки
 * @returns обработчики pointer-событий кнопки ячейки
 */
export const usePressPreview = (
  options: UsePressPreviewOptions
): PressPreviewHandlers => {
  const latestRef = useRef(options);
  const sourceRef = useRef<HTMLElement | null>(null);

  latestRef.current = options;

  const gesture = useMemo(() => {
    return createPressGesture({
      onHold: () => {
        const source = sourceRef.current;

        if (source) {
          latestRef.current.onHold(source);
        }
      },
    });
  }, []);

  useEffect(() => {
    return () => {
      gesture.dispose();
    };
  }, [gesture]);

  const onPointerDown = (event: TargetedPointerEvent<HTMLElement>) => {
    const { button, pointerType, ctrlKey, clientX, clientY, currentTarget } = event;

    if (latestRef.current.isDisabled) return;

    sourceRef.current = currentTarget;
    gesture.start({
      button,
      pointerType,
      isCtrlPressed: ctrlKey,
      x: clientX,
      y: clientY,
    });
  };

  const onPointerEnter = (event: TargetedPointerEvent<HTMLElement>) => {
    const { pointerType, buttons, currentTarget } = event;

    if (latestRef.current.isDisabled || !shouldSwapPreview(pointerType, buttons)) return;

    latestRef.current.onSwap(currentTarget);
  };

  const onPointerMove = ({ clientX, clientY }: TargetedPointerEvent<HTMLElement>) => {
    gesture.move(clientX, clientY);
  };

  const onPointerLeave = () => {
    gesture.cancel();
  };

  return {
    onPointerDown,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onPointerUp: onPointerLeave,
    onPointerCancel: onPointerLeave,
  };
};
