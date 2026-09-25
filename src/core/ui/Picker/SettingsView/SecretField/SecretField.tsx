import type { FunctionComponent as FC } from 'preact';

import { TextInput } from '../../TextInput/TextInput';

import type { SecretFieldProps } from './SecretField.types';

/**
 * Поле ключа или токена: значение скрыто как пароль, а `autocomplete="off"` не даёт
 * браузеру подставить сохранённый пароль сайта.
 */
export const SecretField: FC<SecretFieldProps> = (props) => {
  const { id, label, value, children, onInput } = props;

  const handleFieldInput = (nextValue: string) => {
    onInput(nextValue);
  };

  return (
    <label
      htmlFor={id}
      className="flex flex-col gap-1 text-xs text-cadetGray-30 dark:text-gray-70"
    >
      {label}

      <TextInput
        id={id}
        type="password"
        value={value}
        autoComplete="off"
        onInput={handleFieldInput}
      />

      <p className="m-0 text-xs leading-[1.4]">{children}</p>
    </label>
  );
};
