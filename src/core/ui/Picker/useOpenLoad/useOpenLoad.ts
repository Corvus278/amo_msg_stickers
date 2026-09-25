import { useEffect, useRef } from 'preact/hooks';

import { ensureCustomPack, listRecent } from '../../../db';
import { errorMessage } from '../PickerProvider/errorMessage';
import { usePicker } from '../PickerProvider/usePicker';
import { usePickerView } from '../usePickerView/usePickerView';

/**
 * Загрузка на каждое открытие пикера: сброс статуса, свежие настройки и паки (их могли
 * поменять в другой вкладке). Без истории отправок открывается «GIF» вместо пустых
 * недавних; выбранная пользователем вкладка не трогается. Сбой загрузки (окружение или
 * база недоступны) показывается ошибкой в статусе.
 *
 * @param isOpen — открыт ли пикер
 */
export const useOpenLoad = (isOpen: boolean) => {
  const { refreshSettings, refreshPacks, clearStatus, showError } = usePicker();
  const { view, switchTo } = usePickerView();

  /**
   * Вкладка читается через ref: загрузка идёт на открытие, а не на каждое переключение
   * вкладок, поэтому `view` не должен попадать в зависимости эффекта.
   */
  const viewRef = useRef(view);

  useEffect(() => {
    viewRef.current = view;
  });

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      clearStatus();

      try {
        await refreshSettings();
        await ensureCustomPack();
        await refreshPacks();
        const recent = await listRecent();

        if (viewRef.current.kind === 'recent' && !recent.length) {
          switchTo({ kind: 'gifs' });
        }
      } catch (error) {
        showError(errorMessage(error));
      }
    };

    void load();
  }, [isOpen, refreshSettings, refreshPacks, clearStatus, showError, switchTo]);
};
