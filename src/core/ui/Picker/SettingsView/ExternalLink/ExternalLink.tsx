import type { FunctionComponent as FC } from 'preact';

import type { ExternalLinkProps } from './ExternalLink.types';

/**
 * Ссылка в подсказке настроек открывается в новой вкладке: переход в той же вкладке
 * увёл бы со страницы amo. `noreferrer` не отдаёт сайту адрес чата.
 */
export const ExternalLink: FC<ExternalLinkProps> = (props) => {
  const { href, children } = props;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-blue-50 underline dark:text-beige-70"
    >
      {children}
    </a>
  );
};
