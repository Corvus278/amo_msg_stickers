import type { ComponentChildren } from 'preact';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

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
