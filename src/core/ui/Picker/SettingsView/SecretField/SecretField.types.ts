import type { ComponentChildren } from 'preact';

export type SecretFieldProps = {
  /**
   * id поля — связывает подпись с полем.
   */
  id: string;

  /**
   * Подпись над полем.
   */
  label: string;

  /**
   * Текущее значение ключа или токена.
   */
  value: string;

  /**
   * Подсказка под полем: где взять значение.
   */
  children: ComponentChildren;

  /**
   * Колбэк на ввод: новое значение поля.
   */
  onInput: (value: string) => void;
};
