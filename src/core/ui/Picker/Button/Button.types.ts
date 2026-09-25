import type { VariantProps } from 'class-variance-authority';
import type { ComponentChildren } from 'preact';

import type { buttonVariants } from './Button';

/**
 * Вид обязателен: у кнопки нет вида по умолчанию, поэтому `null` и `undefined` из
 * `VariantProps` отрезаны.
 */
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

export type ButtonProps = {
  /**
   * Вид кнопки: основная — акцентная заливка, второстепенная — заливка поля ввода,
   * опасная — мелкая текстовая кнопка цвета ошибки.
   */
  variant: ButtonVariant;

  /**
   * Кнопка недоступна: полупрозрачна и не нажимается.
   */
  isDisabled?: boolean;

  /**
   * Колбэк на нажатие.
   */
  onClick: () => void;

  /**
   * Подпись кнопки.
   */
  children: ComponentChildren;
};
