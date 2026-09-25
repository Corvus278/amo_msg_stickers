import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import { usePicker } from '../PickerProvider/usePicker';

const statusVariants = cva(
  'shrink-0 border-t border-cadetGray-30/[.28] px-2.5 py-1.5 text-xs dark:border-white-0/10',
  {
    variants: {
      isError: {
        true: 'text-red-30',
        false: 'text-cadetGray-30 dark:text-gray-70',
      },
    },
    defaultVariants: {
      isError: false,
    },
  }
);

/**
 * Строка статуса над вкладками. Без статуса не рендерится вовсе: пустая строка с
 * рамкой сверху отъедала бы высоту у тела панели.
 */
export const StatusBar: FC = () => {
  const { status } = usePicker();

  if (!status) return null;

  const { text, isError } = status;

  return (
    <div role="status" className={statusVariants({ isError })}>
      {text}
    </div>
  );
};
