import { useCallback, useState } from 'preact/hooks';

import { importTelegramSet } from '../../../sources/telegram';
import type { ImportProgress } from '../../../sources/telegram.types';

import { errorMessage } from './errorMessage';
import type { PackImportOptions, PackImportState } from './PickerProvider.types';

/**
 * Импорт пака из Telegram на уровне провайдера. Провайдер живёт всё время страницы, а
 * форма импорта размонтируется при уходе с вкладки «Добавить стикеры»: состояние здесь
 * переживает уход и возврат, и второй импорт поверх идущего не запускается.
 *
 * Статус ««название»: N/M» виден на любой вкладке, вкладка пака появляется после первого
 * готового стикера, по завершении открывается пак.
 *
 * @param options — окружение, настройки и методы провайдера
 * @returns ход импорта и его запуск
 */
export const usePackImport = (options: PackImportOptions): PackImportState => {
  const { env, settings, refreshPacks, showStatus, showError, switchTo } = options;
  const [isImporting, setIsImporting] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);

  const importPack = useCallback(
    async (link: string) => {
      if (isImporting) return;

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
      setPercent(0);

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
        setPercent(null);
      }
    },
    [isImporting, env, settings, refreshPacks, showStatus, showError, switchTo]
  );

  return { isImporting, percent, importPack };
};
