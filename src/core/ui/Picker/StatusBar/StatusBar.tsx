import { clsx } from 'clsx';
import type { FunctionComponent as FC } from 'preact';

import { usePicker } from '../PickerProvider/usePicker';

/**
 * Строка статуса над вкладками. Без статуса не рендерится вовсе: пустая строка с
 * рамкой сверху отъедала бы высоту у тела панели.
 */
export const StatusBar: FC = () => {
  const { status } = usePicker();

  if (!status) return null;

  const { text, isError } = status;

  return (
    <div
      role="status"
      className={clsx(
        'shrink-0 border-t border-cadetGray-30/[.28] px-2.5 py-1.5 text-xs dark:border-white-0/10',
        isError ? 'text-red-30' : 'text-cadetGray-30 dark:text-gray-70'
      )}
    >
      {text}
    </div>
  );
};
