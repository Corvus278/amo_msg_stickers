import type { VariantProps } from 'class-variance-authority';
import type { ComponentChildren } from 'preact';

import type { menuItemVariants } from './MenuItem';

export type MenuItemProps = VariantProps<typeof menuItemVariants> & {
  /**
   * Колбэк на выбор пункта: клик, Enter или пробел. Меню пункт не закрывает — закрывает сам
   * выбор через `useMenuClose`, если он окончательный.
   */
  onSelect: () => void;

  /**
   * Подпись пункта.
   */
  children: ComponentChildren;
};

export type MenuItemVariant = NonNullable<
  VariantProps<typeof menuItemVariants>['variant']
>;
