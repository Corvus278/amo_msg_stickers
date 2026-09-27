import type { FunctionComponent as FC } from 'preact';

import { usePickerView } from '../usePickerView/usePickerView';

import { ModeTab } from './ModeTab/ModeTab';
import { SettingsIcon } from './SettingsIcon/SettingsIcon';

const FOOTER_CLASS = [
  'flex shrink-0 items-center gap-0.5 px-1.5 py-1',
  'border-t border-cadetGray-30/[.28] dark:border-white-0/10',
].join(' ');

const SETTINGS_BUTTON_CLASS = [
  'ml-auto flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
  'text-cadetGray-30 hover:bg-cadetGray-30/[.14] dark:text-gray-70 dark:hover:bg-white-0/[.07]',
].join(' ');

/**
 * Низ панели: переключатель режимов «Стикеры» / «GIF» и кнопка «Настройки». Кнопка лежит
 * вне `tablist`: она открывает экран, а не режим, и в список вкладок не входит.
 */
export const Footer: FC = () => {
  const { openScreen } = usePickerView();

  const handleSettingsClick = () => {
    openScreen('settings');
  };

  return (
    <div className={FOOTER_CLASS}>
      <div role="tablist" aria-label="Режимы" className="flex items-center gap-0.5">
        <ModeTab mode="stickers" title="Стикеры" />
        <ModeTab mode="gifs" title="GIF" />
      </div>

      <button
        type="button"
        title="Настройки"
        aria-label="Настройки"
        className={SETTINGS_BUTTON_CLASS}
        onClick={handleSettingsClick}
      >
        <SettingsIcon />
      </button>
    </div>
  );
};
