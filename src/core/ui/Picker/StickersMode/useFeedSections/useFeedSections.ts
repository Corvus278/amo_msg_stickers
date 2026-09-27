import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import {
  clearRecent,
  deletePack,
  deleteRecent,
  deleteSticker,
  listAllStickers,
  listRecent,
} from '../../../../db';
import type { SendItem } from '../../../../db.types';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';
import { feedSections } from '../feedSections/feedSections';

import type { FeedRead, FeedSections } from './useFeedSections.types';

/**
 * Разделы ленты стикеров: вся библиотека одним чтением и недавние стикеры.
 *
 * Лента перечитывается на каждое открытие пикера — отправка закрывает его, и без этого
 * отправленный стикер не поднялся бы в недавних — и на каждое обновление `packs`: `refreshPacks`
 * зовут импорт, создание и удаление стикеров и паков. Пока идёт перечитывание, видна прежняя
 * лента — без мигания пустого состояния, но с признаком, что она прочитана для прежних `packs`.
 *
 * @param isOpen — открыт ли пикер
 * @returns разделы ленты, удаление стикера и пака, уборка недавних
 */
export const useFeedSections = (isOpen: boolean): FeedSections => {
  const { packs, refreshPacks, dropUrl, showError } = usePicker();
  const [read, setRead] = useState<FeedRead | null>(null);

  /**
   * Номер последнего чтения: ответ устаревшего чтения (импорт поверх открытия, закрытие до
   * ответа базы) не перетирает свежую ленту.
   */
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    requestRef.current += 1;
    const request = requestRef.current;
    const [byPack, recent] = await Promise.all([
      listAllStickers(),
      listRecent('sticker'),
    ]);

    if (request !== requestRef.current) return;

    setRead({ sections: feedSections(packs, byPack, recent), packs });
  }, [packs]);

  useEffect(() => {
    if (!isOpen) return;

    void reload();

    return () => {
      requestRef.current += 1;
    };
  }, [isOpen, reload]);

  const removeSticker = useCallback(
    async (stickerId: string) => {
      try {
        await deleteSticker(stickerId);
        dropUrl(stickerId);
        await refreshPacks();
      } catch (error) {
        showError(errorMessage(error));
      }
    },
    [dropUrl, refreshPacks, showError]
  );

  const removeRecent = useCallback(
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

  /**
   * Object URL стикеров пака отзываются по прочитанному разделу: после удаления пака его
   * стикеров в базе уже нет. Недавние с этими стикерами пропадут из ленты сами — их стикеров
   * больше нет в библиотеке.
   */
  const removePack = useCallback(
    async (packId: string) => {
      const section = read?.sections.find(({ id }) => {
        return id === packId;
      });

      try {
        await deletePack(packId);
        for (const { sticker } of section?.items || []) dropUrl(sticker.id);
        await refreshPacks();
      } catch (error) {
        showError(errorMessage(error));
      }
    },
    [read, dropUrl, refreshPacks, showError]
  );

  /**
   * Очищаются только недавние стикеры: недавние GIF живут в режиме «GIF» отдельно.
   */
  const clearRecentStickers = useCallback(async () => {
    try {
      await clearRecent('sticker');
      await reload();
    } catch (error) {
      showError(errorMessage(error));
    }
  }, [reload, showError]);

  return {
    sections: read?.sections || null,
    isCurrent: read?.packs === packs,
    removeSticker,
    removeRecent,
    removePack,
    clearRecentStickers,
  };
};
