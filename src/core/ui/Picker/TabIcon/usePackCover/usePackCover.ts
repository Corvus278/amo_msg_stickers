import { useEffect, useState } from 'preact/hooks';

import { getSticker, listStickers } from '../../../../db';
import type { Pack } from '../../../../db.types';
import { usePicker } from '../../PickerProvider/usePicker';

import type { PackCover } from './usePackCover.types';

/**
 * Обложка вкладки пака: стикер-обложка пака, а без неё — первый стикер. Пак — зависимость
 * эффекта целиком: `refreshPacks` отдаёт новые объекты, и обложка перечитывается после
 * импорта или добавления стикера. Пока обложка перечитывается, остаётся прежняя.
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
      const id = pack.coverId || (await listStickers(pack.id))[0]?.id;
      const sticker = id ? await getSticker(id) : undefined;

      if (!isStale) setCover({ url: sticker ? urlOf(sticker.id, sticker.blob) : null });
    };

    void load();

    return () => {
      isStale = true;
    };
  }, [pack, urlOf]);

  return cover;
};
