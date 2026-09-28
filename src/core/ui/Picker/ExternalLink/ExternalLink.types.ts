import type { ComponentChildren } from 'preact';

export type ExternalLinkProps = {
  /**
   * Адрес внешней страницы: где берут ключ или токен, страница доки.
   */
  href: string;

  /**
   * Текст ссылки.
   */
  children: ComponentChildren;
};
