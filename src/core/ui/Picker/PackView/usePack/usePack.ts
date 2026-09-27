import { useCallback, useEffect, useState } from 'preact/hooks';

import { deletePack, deleteSticker, listStickers } from '../../../../db';
import { stickerCellName } from '../../cellName/cellName';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';
import { RECENT_SECTION_ID } from '../../usePickerView/sectionIds';
import { usePickerView } from '../../usePickerView/usePickerView';

import type { PackState, PackSticker, PackStickers } from './usePack.types';

/**
 * Открытый пак и его стикеры.
 *
 * Стикеры перечитываются на каждое обновление `packs`: `refreshPacks` зовут импорт,
 * создание и удаление стикеров, и вместе с сеткой перечитывается обложка вкладки пака.
 * Прочитанный список помечен id пака: при переключении на другой пак стикеры прежнего не
 * показываются, пока читаются новые.
 *
 * @param packId — открытый пак
 * @returns пак, его стикеры и удаление стикера или пака целиком
 */
export const usePack = (packId: string): PackState => {
  const { packs, refreshPacks, urlOf, dropUrl, showError } = usePicker();
  const { scrollToSection } = usePickerView();
  const [loaded, setLoaded] = useState<PackStickers | null>(null);

  const pack =
    packs.find(({ id }) => {
      return id === packId;
    }) || null;

  useEffect(() => {
    let isStale = false;

    const load = async () => {
      const records = await listStickers(packId);

      if (isStale) return;

      setLoaded({
        packId,
        stickers: records.map(({ id, blob, emoji }): PackSticker => {
          return {
            id,
            item: { kind: 'local', stickerId: id },
            url: urlOf(id, blob),
            name: stickerCellName(emoji),
          };
        }),
      });
    };

    void load();

    return () => {
      isStale = true;
    };
  }, [packId, packs, urlOf]);

  const stickers = loaded && loaded.packId === packId ? loaded.stickers : null;

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

  const removePack = useCallback(async () => {
    try {
      await deletePack(packId);

      for (const { id } of stickers || []) dropUrl(id);
      await refreshPacks();
      scrollToSection(RECENT_SECTION_ID);
    } catch (error) {
      showError(errorMessage(error));
    }
  }, [packId, stickers, dropUrl, refreshPacks, scrollToSection, showError]);

  return { pack, stickers, removeSticker, removePack };
};
