import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import { usePicker } from '../PickerProvider/usePicker';

const statusVariants = cva(
  'border-t border-cadetGray-30/[.28] px-2.5 py-1.5 text-xs dark:border-white-0/10',
  {
    variants: {
      isError: {
        true: 'text-red-30',
        false: 'text-cadetGray-30 dark:text-gray-70',
      },
    },
  }
);

/**
 * Строка статуса над вкладками.
 *
 * Live region — обёртка без отступов: она смонтирована и видна всегда, а без статуса пуста
 * и не занимает высоты. Скринридер объявляет изменение содержимого существующей области,
 * а область, появившуюся вместе с текстом или из `display: none`, обычно пропускает.
 * Строка с рамкой рендерится только со статусом: пустая отъедала бы высоту у тела панели.
 */
export const StatusBar: FC = () => {
  const { status } = usePicker();

  return (
    <div role="status" className="shrink-0">
      {status && (
        <div className={statusVariants({ isError: status.isError })}>{status.text}</div>
      )}
    </div>
  );
};
