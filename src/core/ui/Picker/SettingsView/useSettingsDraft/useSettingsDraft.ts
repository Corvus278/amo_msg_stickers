import { useCallback, useState } from 'preact/hooks';

import type { Settings } from '../../../../host.types';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';

import type { SettingsDraft, SettingsEdits } from './useSettingsDraft.types';

/**
 * Черновик формы настроек. Форма заполняется заново при каждом перечитывании настроек —
 * на открытие пикера и после сохранения: несохранённый ввод при повторном открытии
 * сбрасывается к сохранённым значениям.
 *
 * Хранятся только правки, помеченные настройками, поверх которых они сделаны, а значения
 * полей складываются в рендере. Перечитанные настройки — новый объект, и правки поверх
 * прежнего просто перестают применяться: без синхронизации эффектом и лишнего рендера со
 * старым черновиком.
 *
 * @returns значения полей, их правка и сохранение
 */
export const useSettingsDraft = (): SettingsDraft => {
  const { env, settings, refreshSettings, showStatus, showError } = usePicker();
  const [edits, setEdits] = useState<SettingsEdits | null>(null);
  const isEditsActual = !!edits && edits.base === settings;
  const draft: Settings = isEditsActual ? { ...settings, ...edits.values } : settings;

  const changeField = useCallback(
    (key: keyof Settings, value: string) => {
      setEdits((prev) => {
        const values = prev && prev.base === settings ? prev.values : null;

        return { base: settings, values: { ...values, [key]: value } };
      });
    },
    [settings]
  );

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
