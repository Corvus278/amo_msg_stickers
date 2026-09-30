import type { TargetedPointerEvent } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';

import { createPressGesture } from '../pressGesture/pressGesture';

import type {
  PressPreviewHandlers,
  UsePressPreviewOptions,
} from './usePressPreview.types';

/**
 * Удержание основной кнопки на ячейке: по `HOLD_DELAY_MS` зовёт `onHold`. Отпускание после
 * удержания и закрытие предпросмотра здесь не обрабатываются — их держит провайдер
 * предпросмотра на `window`, поэтому ячейка не помнит, что её держали.
 *
 * Актуальные `onHold` и `isDisabled` читаются в момент нажатия и срабатывания из ref, так
 * что жест не пересоздаётся при перерисовке ячейки и не теряет отсчёт. Таймер снимается при
 * размонтировании.
 *
 * @param options — колбэк удержания и признак занятой ячейки
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
    const { button, pointerType, clientX, clientY, currentTarget } = event;

    if (latestRef.current.isDisabled) return;

    sourceRef.current = currentTarget;
    gesture.start({ button, pointerType, x: clientX, y: clientY });
  };

  const onPointerMove = ({ clientX, clientY }: TargetedPointerEvent<HTMLElement>) => {
    gesture.move(clientX, clientY);
  };

  const onPointerLeave = () => {
    gesture.cancel();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerLeave,
    onPointerUp: onPointerLeave,
    onPointerCancel: onPointerLeave,
  };
};
