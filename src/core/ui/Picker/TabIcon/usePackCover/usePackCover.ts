import { useEffect, useState } from 'preact/hooks';

import { getSticker, listStickers } from '../../../../db';
import type { Pack } from '../../../../db.types';
import { usePicker } from '../../PickerProvider/usePicker';

import type { PackCover } from './usePackCover.types';

/**
 * Обложка вкладки пака: стикер-обложка пака, а если её нет или она удалена из пака —
 * первый стикер. Пак — зависимость эффекта целиком: `refreshPacks` отдаёт новые объекты,
 * и обложка перечитывается после импорта, добавления или удаления стикера. Пока обложка
 * перечитывается, остаётся прежняя.
 *
 * Первый стикер берётся из полного списка пака, а не курсором по индексу: индекс `packId`
 * упорядочен по id, а не по времени добавления. Блобы при этом не читаются — в записях
 * лежат только ссылки на них.
 *
 * @param pack — пак вкладки
 * @returns `null` — обложка ещё не прочитана; `{ url: null }` — стикеров в паке нет
 */
export const usePackCover = (pack: Pack): PackCover | null => {
  const { urlOf } = usePicker();
  const [cover, setCover] = useState<PackCover | null>(null);

  useEffect(() => {
    let isStale = false;

    const load = async () => {
      const coverSticker = pack.coverId ? await getSticker(pack.coverId) : undefined;
      const sticker = coverSticker || (await listStickers(pack.id))[0];

      if (!isStale) setCover({ url: sticker ? urlOf(sticker.id, sticker.blob) : null });
    };

    void load();

    return () => {
      isStale = true;
    };
  }, [pack, urlOf]);

  return cover;
};
