import { useEffect, useState } from 'preact/hooks';

import { listRecent } from '../../../../db';
import type { RemoteGif } from '../../../../db.types';
import { errorMessage } from '../../PickerProvider/errorMessage';
import { usePicker } from '../../PickerProvider/usePicker';
import { recentGifs } from '../gifSections/gifSections';

/**
 * Недавно отправленные GIF. Список перечитывается на каждое открытие пикера: отправка
 * закрывает его, и без этого отправленный GIF не поднялся бы наверх. Ответ, пришедший после
 * закрытия, отбрасывается.
 *
 * @param isOpen — открыт ли пикер
 * @returns недавние GIF, свежие первыми
 */
export const useRecentGifs = (isOpen: boolean): RemoteGif[] => {
  const { showError } = usePicker();
  const [recent, setRecent] = useState<RemoteGif[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isActual = true;

    const read = async () => {
      try {
        const records = await listRecent('gif');

        if (isActual) setRecent(recentGifs(records));
      } catch (error) {
        if (isActual) showError(errorMessage(error));
      }
    };

    void read();

    return () => {
      isActual = false;
    };
  }, [isOpen, showError]);

  return recent;
};
