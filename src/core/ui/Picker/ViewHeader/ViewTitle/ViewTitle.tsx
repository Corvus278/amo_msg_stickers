import type { FunctionComponent as FC } from 'preact';

import type { ViewTitleProps } from './ViewTitle.types';

/**
 * Строка заголовка в шапке представления: длинный заголовок обрезается многоточием и не
 * выталкивает действия.
 */
export const ViewTitle: FC<ViewTitleProps> = (props) => {
  const { title, children } = props;

  return (
    <div className="flex min-h-5.5 items-center gap-2">
      <span className="flex-1 truncate font-semibold">{title}</span>

      {children}
    </div>
  );
};
