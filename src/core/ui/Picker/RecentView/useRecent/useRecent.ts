import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { deleteRecent, getSticker, listRecent } from '../../../../db';
import type { RecentRec, SendItem } from '../../../../db.types';
import { gifCellName, stickerCellName } from '../../cellName/cellName';
import { errorMessage } from '../../PickerProvider/errorMessage';
import type { PickerContextValue } from '../../PickerProvider/PickerProvider.types';
import { usePicker } from '../../PickerProvider/usePicker';

import type { Recent, RecentCell, RecentEntry } from './useRecent.types';

/**
 * Картинка и имя элемента недавних.
 *
 * @param item — отправленный элемент
 * @param urlOf — кэш object URL стикеров из контекста
 * @returns `null` — свой стикер удалён из библиотеки, элемент не показывается
 */
const itemCell = async (
  item: SendItem,
  urlOf: PickerContextValue['urlOf']
): Promise<RecentCell | null> => {
  switch (item.kind) {
    case 'local': {
      const sticker = await getSticker(item.stickerId);

      if (!sticker) return null;

      const { id, blob, emoji } = sticker;

      return { url: urlOf(id, blob), name: stickerCellName(emoji) };
    }

    case 'remote': {
      const { gif } = item;

      return { url: gif.previewUrl, name: gifCellName(gif) };
    }

    default: {
      const unknownItem: never = item;

      throw new Error(`Unknown send item: ${JSON.stringify(unknownItem)}`);
    }
  }
};

/**
 * Недавние отправки. Список перечитывается на каждое открытие пикера: отправка закрывает
 * пикер, а представление остаётся смонтированным, и без перечитывания отправленный
 * элемент не поднялся бы наверх. Пока идёт перечитывание, виден прежний список — без
 * мигания пустого состояния.
 *
 * @param isOpen — открыт ли пикер
 * @returns недавние и удаление из них
 */
export const useRecent = (isOpen: boolean): Recent => {
  const { urlOf, showError } = usePicker();
  const [entries, setEntries] = useState<RecentEntry[] | null>(null);

  /**
   * Номер последнего чтения: ответ устаревшего чтения (удаление поверх открытия, закрытие
   * до ответа базы) не перетирает свежий список.
   */
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    requestRef.current += 1;
    const request = requestRef.current;
    const records = await listRecent();

    const resolved = await Promise.all(
      records.map(async ({ key, item }: RecentRec) => {
        return { key, item, cell: await itemCell(item, urlOf) };
      })
    );

    if (request !== requestRef.current) return;

    setEntries(
      resolved.reduce<RecentEntry[]>((acc, { key, item, cell }) => {
        if (cell) acc.push({ key, item, ...cell });

        return acc;
      }, [])
    );
  }, [urlOf]);

  useEffect(() => {
    if (!isOpen) return;

    void reload();

    return () => {
      requestRef.current += 1;
    };
  }, [isOpen, reload]);

  const removeItem = useCallback(
    async (item: SendItem) => {
      try {
        await deleteRecent(item);
        await reload();
      } catch (error) {
        showError(errorMessage(error));
      }
    },
    [reload, showError]
  );

  return { entries, removeItem };
};
