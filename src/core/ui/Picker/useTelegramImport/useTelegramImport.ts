import { useCallback, useState } from 'preact/hooks';

import { usePicker } from '../PickerProvider/usePicker';

import type { TelegramImportState } from './useTelegramImport.types';

/**
 * Форма импорта пака из Telegram по ссылке: прогресс полосой и статусом ««название»: N/M»,
 * вкладка пака — после первого готового стикера, по завершении — переход в пак.
 *
 * Импорт не отменяется уходом с вкладки: он доводится до конца и открывает пак. Ход
 * импорта хранит провайдер, поэтому после возврата на вкладку видна полоса прогресса, а
 * кнопка «Импорт» недоступна, пока импорт не закончится. Введённая ссылка уходом с вкладки
 * сбрасывается.
 *
 * @returns ссылка, ход импорта и его запуск
 */
export const useTelegramImport = (): TelegramImportState => {
  const { packImport } = usePicker();
  const { isImporting, percent, importPack } = packImport;
  const [link, setLink] = useState('');

  const changeLink = useCallback((nextLink: string) => {
    setLink(nextLink);
  }, []);

  const startImport = useCallback(async () => {
    await importPack(link);
  }, [importPack, link]);

  return { link, changeLink, isImporting, percent, startImport };
};
