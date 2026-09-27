import { useEffect } from 'preact/hooks';

import { ensureCustomPack } from '../../../db';
import { errorMessage } from '../PickerProvider/errorMessage';
import { usePicker } from '../PickerProvider/usePicker';

/**
 * Загрузка на каждое открытие пикера: сброс статуса, свежие настройки и паки (их могли
 * поменять в другой вкладке). Сбой загрузки (окружение или база недоступны) показывается
 * ошибкой в статусе.
 *
 * @param isOpen — открыт ли пикер
 */
export const useOpenLoad = (isOpen: boolean) => {
  const { refreshSettings, refreshPacks, clearStatus, showError } = usePicker();

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      clearStatus();

      try {
        await refreshSettings();
        await ensureCustomPack();
        await refreshPacks();
      } catch (error) {
        showError(errorMessage(error));
      }
    };

    void load();
  }, [isOpen, refreshSettings, refreshPacks, clearStatus, showError]);
};
