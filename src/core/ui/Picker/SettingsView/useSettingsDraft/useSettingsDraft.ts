import { useCallback, useEffect, useState } from 'preact/hooks';

import type { Settings } from '../../../../host.types';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';

import type { SettingsDraft } from './useSettingsDraft.types';

/**
 * Черновик формы настроек. Форма заполняется заново при каждом перечитывании настроек —
 * на открытие пикера и после сохранения: несохранённый ввод при повторном открытии
 * сбрасывается к сохранённым значениям.
 *
 * @returns значения полей, их правка и сохранение
 */
export const useSettingsDraft = (): SettingsDraft => {
  const { env, settings, refreshSettings, showStatus, showError } = usePicker();
  const [draft, setDraft] = useState<Settings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const changeField = useCallback((key: keyof Settings, value: string) => {
    setDraft((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const save = useCallback(async () => {
    const { giphyKey, klipyKey, telegramToken } = draft;

    try {
      await env.setSettings({
        giphyKey: giphyKey.trim(),
        klipyKey: klipyKey.trim(),
        telegramToken: telegramToken.trim(),
      });

      await refreshSettings();
      showStatus('Сохранено');
    } catch (error) {
      showError(errorMessage(error));
    }
  }, [draft, env, refreshSettings, showStatus, showError]);

  return { draft, changeField, save };
};
