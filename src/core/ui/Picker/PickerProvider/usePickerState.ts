import { useCallback, useState } from 'preact/hooks';

import { listPacks } from '../../../db';
import type { Pack, SendItem } from '../../../db.types';
import { DEFAULT_SETTINGS } from '../../../host';
import type { Settings } from '../../../host.types';
import { useObjectUrls } from '../useObjectUrls/useObjectUrls';
import type { View } from '../usePickerView/usePickerView.types';

import { errorMessage } from './errorMessage';
import type {
  PickerStateOptions,
  PickerStateValue,
  PickerStatus,
} from './PickerProvider.types';
import { usePackImport } from './usePackImport';

const INITIAL_VIEW: View = { kind: 'recent' };

/**
 * Состояние `PickerProvider`. Методы стабильны между рендерами: потребители кладут их в
 * зависимости эффектов, не рискуя перезапуском на каждый рендер.
 *
 * @param options — окружение и колбэки фасада
 * @returns значения обоих контекстов провайдера
 */
export const usePickerState = (options: PickerStateOptions): PickerStateValue => {
  const { env, onSend, onClose, isOpen } = options;
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [status, setStatus] = useState<PickerStatus | null>(null);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const { urlOf, dropUrl } = useObjectUrls(isOpen);

  const refreshSettings = useCallback(async () => {
    setSettings(await env.getSettings());
  }, [env]);

  const refreshPacks = useCallback(async () => {
    setPacks(await listPacks());
  }, []);

  const showStatus = useCallback((text: string) => {
    setStatus({ text, isError: false });
  }, []);

  const showError = useCallback((text: string) => {
    setStatus({ text, isError: true });
  }, []);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const send = useCallback(
    async (item: SendItem) => {
      showStatus('Отправляю…');

      try {
        await onSend(item);
        clearStatus();
        onClose();
      } catch (error) {
        showError(errorMessage(error) || 'Ошибка отправки');
      }
    },
    [onSend, onClose, showStatus, showError, clearStatus]
  );

  const switchTo = useCallback((nextView: View) => {
    setView(nextView);
    setStatus(null);
  }, []);

  const packImport = usePackImport({
    env,
    settings,
    refreshPacks,
    showStatus,
    showError,
    switchTo,
  });

  return {
    picker: {
      env,
      settings,
      refreshSettings,
      packs,
      refreshPacks,
      status,
      showStatus,
      showError,
      clearStatus,
      send,
      urlOf,
      dropUrl,
      packImport,
    },
    view: { view, switchTo },
  };
};
