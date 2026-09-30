import type { FunctionComponent as FC } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

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
 */
export const PreviewProvider: FC<PreviewProviderProps> = (props) => {
  const { phase, children } = props;
  const { setHold } = usePicker();
  const { mode, screen } = usePickerView();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const isOpen = preview !== null;
  const isHold = preview?.mode === 'hold';
  const isPanelClosed = phase === 'closed';

  const close = useCallback(() => {
    setPreview(null);
  }, []);

  const openHold = useCallback((target: PreviewTarget, source: HTMLElement) => {
    setPreview({ target, mode: 'hold', source });
  }, []);

  const openPinned = useCallback((target: PreviewTarget, source: HTMLElement) => {
    setPreview({ target, mode: 'pinned', source });
  }, []);

  useEffect(() => {
    setHold('preview', isOpen);
  }, [isOpen, setHold]);

  useEffect(() => {
    return () => {
      setHold('preview', false);
    };
  }, [setHold]);

  useEffect(() => {
    if (isPanelClosed) close();
  }, [isPanelClosed, close]);

  useEffect(() => {
    close();
  }, [mode, screen, close]);

  useEffect(() => {
    if (!isHold) return undefined;

    return watchHoldRelease(window, close);
  }, [isHold, close]);

  const value = useMemo<PreviewContextValue>(() => {
    return { preview, openHold, openPinned, close };
  }, [preview, openHold, openPinned, close]);

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
};
