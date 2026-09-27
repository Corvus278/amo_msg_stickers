import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import type { MenuItemProps } from './MenuItem.types';

export const menuItemVariants = cva(
  [
    'flex h-8 w-full shrink-0 cursor-pointer items-center whitespace-nowrap rounded-md bg-transparent px-3',
    'text-left font-primary text-xsm leading-[normal] outline-none transition-colors duration-base',
    'hover:bg-cadetGray-30/[.14] focus-visible:bg-cadetGray-30/[.14]',
    'dark:hover:bg-white-0/[.07] dark:focus-visible:bg-white-0/[.07]',
  ],
  {
    variants: {
      variant: {
        default: 'text-gray-30 dark:text-gray-40',
        danger: 'text-red-30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Пункт меню. Вне порядка Tab: по пунктам ходят стрелки, Tab закрывает меню.
 */
export const MenuItem: FC<MenuItemProps> = (props) => {
  const { variant, onSelect, children } = props;

  const handleItemClick = () => {
    onSelect();
  };

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={menuItemVariants({ variant })}
      onClick={handleItemClick}
    >
      {children}
    </button>
  );
};
