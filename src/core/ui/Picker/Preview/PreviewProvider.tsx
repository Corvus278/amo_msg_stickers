import type { FunctionComponent as FC } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { usePicker } from '../PickerProvider/usePicker';
import { usePickerView } from '../usePickerView/usePickerView';

import { watchHoldRelease } from './holdRelease/holdRelease';
import { PreviewContext } from './PreviewContext';
import type {
  PreviewContextValue,
  PreviewProviderProps,
  PreviewState,
  PreviewTarget,
} from './PreviewProvider.types';

/**
 * Предпросмотр один на панель, а не на ячейку: ячейки лежат под виртуализацией и
 * размонтируются, оверлей и отпускание кнопки должны их пережить.
 *
 * Пока предпросмотр открыт, попап удерживается (причина `preview`): уход курсора за панель
 * посреди удержания не закрывает попап. Предпросмотр закрывается вместе с панелью, при
 * переключении режима и при открытии экрана — обычные клики под подложкой закрыты, но
 * переключение идёт и с клавиатуры.
 *
 * Пока кнопка зажата, курсор можно вести по другим ячейкам: `swapHold` подставляет ячейку
 * под курсором без новой задержки, слушатели отпускания при этом остаются теми же.
 *
 * Слушатели отпускания взводятся в `openHold` синхронно, а не эффектом после рендера:
 * `pointerup` в пределах кадра после срабатывания задержки в эффект бы не успел, и предпросмотр
 * остался бы открытым без кнопки.
 */
export const PreviewProvider: FC<PreviewProviderProps> = (props) => {
  const { phase, children } = props;
  const { setHold } = usePicker();
  const { mode, screen } = usePickerView();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  /**
   * Уходящий предпросмотр считается закрытым: слой ещё на экране, но удержания попапа нет.
   */
  const isOpen = preview !== null && !preview.isLeaving;
  const isPanelClosed = phase === 'closed';

  const unwatchReleaseRef = useRef<(() => void) | null>(null);

  const unwatchRelease = useCallback(() => {
    unwatchReleaseRef.current?.();
    unwatchReleaseRef.current = null;
  }, []);

  /**
   * Закрытие — не обнуление, а уход: слой доигрывает обратную анимацию и по её концу зовёт
   * `finishLeave`. Закрытый предпросмотр остаётся `null`, уходящий — уходящим.
   */
  const close = useCallback(() => {
    unwatchRelease();
    setPreview((current) => {
      return current && !current.isLeaving ? { ...current, isLeaving: true } : current;
    });
  }, [unwatchRelease]);

  const finishLeave = useCallback((leaving: PreviewState) => {
    setPreview((current) => {
      return current === leaving ? null : current;
    });
  }, []);

  const openHold = useCallback(
    (target: PreviewTarget, source: HTMLElement) => {
      unwatchRelease();
      unwatchReleaseRef.current = watchHoldRelease(window, close);
      setPreview({ target, mode: 'hold', source, isLeaving: false });
    },
    [unwatchRelease, close]
  );

  const swapHold = useCallback((target: PreviewTarget, source: HTMLElement) => {
    setPreview((current) => {
      return current?.mode === 'hold' && !current.isLeaving
        ? { target, mode: 'hold', source, isLeaving: false }
        : current;
    });
  }, []);

  const openPinned = useCallback(
    (target: PreviewTarget, source: HTMLElement) => {
      unwatchRelease();
      setPreview({ target, mode: 'pinned', source, isLeaving: false });
    },
    [unwatchRelease]
  );

  useEffect(() => {
    setHold('preview', isOpen);
  }, [isOpen, setHold]);

  useEffect(() => {
    return () => {
      unwatchRelease();
      setHold('preview', false);
    };
  }, [setHold, unwatchRelease]);

  useEffect(() => {
    if (isPanelClosed) close();
  }, [isPanelClosed, close]);

  useEffect(() => {
    close();
  }, [mode, screen, close]);

  const value = useMemo<PreviewContextValue>(() => {
    return { preview, openHold, swapHold, openPinned, close, finishLeave };
  }, [preview, openHold, swapHold, openPinned, close, finishLeave]);

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};
