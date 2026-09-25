import { useCallback, useState } from 'preact/hooks';

import { importTelegramSet } from '../../../sources/telegram';
import type { ImportProgress } from '../../../sources/telegram.types';
import { errorMessage } from '../PickerProvider/errorMessage';
import { usePicker } from '../PickerProvider/usePicker';
import { usePickerView } from '../usePickerView/usePickerView';

import type { TelegramImportState } from './useTelegramImport.types';

/**
 * Импорт пака из Telegram по ссылке: прогресс полосой и статусом ««название»: N/M»,
 * вкладка пака — после первого готового стикера, по завершении — переход в пак.
 *
 * Импорт не отменяется уходом с вкладки: он доводится до конца и открывает пак. Ход
 * импорта виден в статусе на любой вкладке, а полоса прогресса после возврата на
 * вкладку скрыта.
 *
 * @returns ссылка, ход импорта и его запуск
 */
export const useTelegramImport = (): TelegramImportState => {
  const { env, settings, refreshPacks, showStatus, showError } = usePicker();
  const { switchTo } = usePickerView();
  const [link, setLink] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);

  const changeLink = useCallback((nextLink: string) => {
    setLink(nextLink);
  }, []);

  const startImport = useCallback(async () => {
    const trackProgress = ({ done, total, title }: ImportProgress) => {
      setPercent(total ? (done / total) * 100 : 0);
      showStatus(`«${title}»: ${done}/${total}`);

      /**
       * Первый готовый стикер — сразу показываем вкладку пака, не дожидаясь импорта
       * целиком.
       */
      if (done === 1) void refreshPacks();
    };

    setIsImporting(true);
    setPercent((current) => {
      return current || 0;
    });

    try {
      const pack = await importTelegramSet(
        env,
        settings.telegramToken,
        link,
        trackProgress
      );

      await refreshPacks();

      /**
       * Статус — после переключения: `switchTo` сбрасывает статус прошлого представления.
       */
      switchTo({ kind: 'pack', packId: pack.id });
      showStatus(`Пак «${pack.title}» добавлен`);
    } catch (error) {
      showError(errorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }, [env, settings, link, refreshPacks, showStatus, showError, switchTo]);

  return { link, changeLink, isImporting, percent, startImport };
};
