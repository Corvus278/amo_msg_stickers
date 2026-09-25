import type { FunctionComponent as FC, JSX } from 'preact';

import type { TextInputProps } from './TextInput.types';

/**
 * Размер шрифта не задан: поле наследует его от контейнера, и в подписи настроек оно
 * мельче, чем в строке импорта.
 */
const FIELD_CLASS = [
  'h-8 w-full rounded-lg border-0 px-2.5 outline-none',
  'bg-cadetGray-30/[.12] text-gray-30 placeholder:text-cadetGray-30',
  'dark:bg-white-0/[.06] dark:text-gray-40 dark:placeholder:text-gray-70',
].join(' ');

export const TextInput: FC<TextInputProps> = (props) => {
  const { id, type, value, placeholder, autoComplete, inputRef, onInput } = props;

  const handleFieldInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    onInput(event.currentTarget.value);
  };

  return (
    <input
      ref={inputRef || null}
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={FIELD_CLASS}
      onInput={handleFieldInput}
    />
  );
};
