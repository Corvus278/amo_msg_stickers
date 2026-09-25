import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import type { ButtonProps } from './Button.types';

/**
 * Шрифт задаётся явно, а не наследуется: preflight Tailwind сбрасывает у кнопки
 * `font` в `inherit`, а подпись кнопки — всегда 13px или 12px независимо от
 * контейнера, например от подписи поля.
 *
 * Размер входит в вариант целиком: у опасной кнопки своя высота, отступы и шрифт, а
 * конфликтующих утилит на одном элементе быть не должно (`tailwind-merge` не берём).
 */
export const buttonVariants = cva(
  'shrink-0 cursor-pointer rounded-lg font-primary leading-[normal] disabled:cursor-default disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'h-8 px-3.5 text-xsm font-semibold bg-blue-50 text-white-0 dark:bg-beige-70 dark:text-gray-10',
        danger: 'h-5.5 px-1.5 text-xs font-normal bg-transparent text-red-30',
      },
    },
  }
);

export const Button: FC<ButtonProps> = (props) => {
  const { variant, isDisabled, onClick, children } = props;

  const handleButtonClick = () => {
    onClick();
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={buttonVariants({ variant })}
      onClick={handleButtonClick}
    >
      {children}
    </button>
  );
};
