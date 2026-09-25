import type { FunctionComponent as FC } from 'preact';

import type { ViewHeaderProps } from './ViewHeader.types';

/**
 * Шапка представления. Отступы общие у всех представлений: тело панели не прыгает при
 * переключении вкладок.
 */
export const ViewHeader: FC<ViewHeaderProps> = (props) => {
  const { children } = props;

  return <div className="flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5">{children}</div>;
};
