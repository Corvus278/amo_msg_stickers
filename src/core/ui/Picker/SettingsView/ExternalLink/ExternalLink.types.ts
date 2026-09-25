import type { ComponentChildren } from 'preact';

export type ExternalLinkProps = {
  /**
   * Адрес страницы, где берут ключ или токен.
   */
  href: string;

  /**
   * Текст ссылки.
   */
  children: ComponentChildren;
};
