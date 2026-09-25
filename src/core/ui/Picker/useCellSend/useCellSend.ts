import { useCallback, useState } from 'preact/hooks';

import type { SendItem } from '../../../db.types';
import { usePicker } from '../PickerProvider/usePicker';

import type { CellSend } from './useCellSend.types';

/**
 * Отправка из ячейки сетки. Занятость живёт в ячейке, а не в провайдере: повторное
 * нажатие на ту же ячейку во время отправки не уходит вторым стикером, а соседние
 * ячейки остаются доступными.
 *
 * @param item — что отправляет ячейка
 * @returns занятость ячейки и отправка
 */
export const useCellSend = (item: SendItem): CellSend => {
  const { send } = usePicker();
  const [isBusy, setIsBusy] = useState(false);

  const sendItem = useCallback(async () => {
    setIsBusy(true);

    try {
      await send(item);
    } finally {
      setIsBusy(false);
    }
  }, [send, item]);

  return { isBusy, sendItem };
};
