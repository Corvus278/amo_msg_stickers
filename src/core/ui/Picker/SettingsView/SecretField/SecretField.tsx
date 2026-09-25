import type { FunctionComponent as FC } from 'preact';

import { TextInput } from '../../TextInput/TextInput';

import type { SecretFieldProps } from './SecretField.types';

/**
 * Поле ключа или токена: значение скрыто как пароль, а `autocomplete="off"` не даёт
 * браузеру подставить сохранённый пароль сайта.
 *
 * Подсказка стоит рядом с `<label>`, а не внутри: в `<label>` допустим только строчный
 * контент, и её текст со ссылкой попал бы в имя поля. К полю она привязана описанием.
 */
export const SecretField: FC<SecretFieldProps> = (props) => {
  const { id, label, value, children, onInput } = props;
  const hintId = `${id}-hint`;

  const handleFieldInput = (nextValue: string) => {
    onInput(nextValue);
  };

  return (
    <div className="flex flex-col gap-1 text-xs text-cadetGray-30 dark:text-gray-70">
      <label htmlFor={id}>{label}</label>

      <TextInput
        id={id}
        type="password"
        value={value}
        autoComplete="off"
        describedBy={hintId}
        onInput={handleFieldInput}
      />

      <p id={hintId} className="m-0 text-xs leading-[1.4]">
        {children}
      </p>
    </div>
  );
};
