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
  const isOpen = preview !== null;
  const isPanelClosed = phase === 'closed';

  const unwatchReleaseRef = useRef<(() => void) | null>(null);

  const unwatchRelease = useCallback(() => {
    unwatchReleaseRef.current?.();
    unwatchReleaseRef.current = null;
  }, []);

  const close = useCallback(() => {
    unwatchRelease();
    setPreview(null);
  }, [unwatchRelease]);

  const openHold = useCallback(
    (target: PreviewTarget, source: HTMLElement) => {
      unwatchRelease();
      unwatchReleaseRef.current = watchHoldRelease(window, close);
      setPreview({ target, mode: 'hold', source });
    },
    [unwatchRelease, close]
  );

  const swapHold = useCallback((target: PreviewTarget, source: HTMLElement) => {
    setPreview((current) => {
      return current?.mode === 'hold' ? { target, mode: 'hold', source } : current;
    });
  }, []);

  const openPinned = useCallback(
    (target: PreviewTarget, source: HTMLElement) => {
      unwatchRelease();
      setPreview({ target, mode: 'pinned', source });
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
    return { preview, openHold, swapHold, openPinned, close };
  }, [preview, openHold, swapHold, openPinned, close]);

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};
