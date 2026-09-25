import { clsx } from 'clsx';
import type { FunctionComponent as FC } from 'preact';

import type { ButtonProps, ButtonVariant } from './Button.types';

/**
 * Шрифт задаётся явно, а не наследуется: preflight Tailwind сбрасывает у кнопки
 * `font` в `inherit`, а подпись кнопки — всегда 13px или 12px независимо от
 * контейнера, например от подписи поля.
 */
const BASE_CLASS =
  'shrink-0 cursor-pointer rounded-lg font-primary leading-[normal] disabled:cursor-default disabled:opacity-50';

/**
 * Размер входит в вариант целиком: у опасной кнопки своя высота, отступы и шрифт, а
 * конфликтующих утилит на одном элементе быть не должно (`tailwind-merge` не берём).
 *
 * @param variant — вид кнопки
 * @returns классы вида
 */
const getVariantClass = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary': {
      return 'h-8 px-3.5 text-xsm font-semibold bg-blue-50 text-white-0 dark:bg-beige-70 dark:text-gray-10';
    }

    case 'secondary': {
      return 'h-8 px-3.5 text-xsm font-semibold bg-cadetGray-30/[.12] text-gray-30 dark:bg-white-0/[.06] dark:text-gray-40';
    }

    case 'danger': {
      return 'h-5.5 px-1.5 text-xs font-normal bg-transparent text-red-30';
    }

    default: {
      const unknownVariant: never = variant;

      throw new Error(`Unknown button variant: ${String(unknownVariant)}`);
    }
  }
};

export const Button: FC<ButtonProps> = (props) => {
  const { variant, isDisabled, onClick, children } = props;

  const handleButtonClick = () => {
    onClick();
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={clsx(BASE_CLASS, getVariantClass(variant))}
      onClick={handleButtonClick}
    >
      {children}
    </button>
  );
};
