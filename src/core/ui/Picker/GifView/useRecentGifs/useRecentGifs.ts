import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { clearRecent, deleteRecent, listRecent } from '../../../../db';
import type { RemoteGif } from '../../../../db.types';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';
import { recentGifs } from '../gifSections/gifSections';

import type { RecentGifs } from './useRecentGifs.types';

/**
 * Недавно отправленные GIF. Список перечитывается на каждое открытие пикера: отправка
 * закрывает его, и без этого отправленный GIF не поднялся бы наверх. Ответ, пришедший после
 * закрытия или после более свежего чтения, отбрасывается.
 *
 * @param isOpen — открыт ли пикер
 * @returns недавние GIF, свежие первыми, и их уборка
 */
export const useRecentGifs = (isOpen: boolean): RecentGifs => {
  const { showError } = usePicker();
  const [recent, setRecent] = useState<RemoteGif[]>([]);
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    requestRef.current += 1;
    const request = requestRef.current;

    try {
      const records = await listRecent('gif');

      if (request === requestRef.current) setRecent(recentGifs(records));
    } catch (error) {
      if (request === requestRef.current) showError(errorMessage(error));
    }
  }, [showError]);

  useEffect(() => {
    if (!isOpen) return;

    void reload();

    return () => {
      requestRef.current += 1;
    };
  }, [isOpen, reload]);

  const remove = useCallback(
    async (gif: RemoteGif) => {
      try {
        await deleteRecent({ kind: 'remote', gif });
      } catch (error) {
        showError(errorMessage(error));

        return;
      }

      await reload();
    },
    [reload, showError]
  );

  /**
   * Очищаются только недавние GIF: недавние стикеры живут в режиме «Стикеры» отдельно.
   */
  const clear = useCallback(async () => {
    try {
      await clearRecent('gif');
    } catch (error) {
      showError(errorMessage(error));

      return;
    }

    await reload();
  }, [reload, showError]);

  return { recent, remove, clear };
};
