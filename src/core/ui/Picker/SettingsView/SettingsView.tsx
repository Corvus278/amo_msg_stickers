import type { FunctionComponent as FC } from 'preact';

import { Button } from '../Button/Button';
import type { View } from '../usePickerView/usePickerView.types';
import { ViewBody } from '../ViewBody/ViewBody';
import { ViewHeader } from '../ViewHeader/ViewHeader';
import { ViewTitle } from '../ViewHeader/ViewTitle/ViewTitle';

import { ExternalLink } from './ExternalLink/ExternalLink';
import { SecretField } from './SecretField/SecretField';
import { useSettingsDraft } from './useSettingsDraft/useSettingsDraft';

const SETTINGS_VIEW: View = { kind: 'settings' };

/**
 * Ключи GIPHY и KLIPY и токен Telegram-бота. Сохранённые значения сразу применяются в
 * ленте GIF и импорте, без перезагрузки страницы.
 */
export const SettingsView: FC = () => {
  const { draft, changeField, save } = useSettingsDraft();
  const { giphyKey, klipyKey, telegramToken } = draft;

  const handleGiphyKeyInput = (value: string) => {
    changeField('giphyKey', value);
  };

  const handleKlipyKeyInput = (value: string) => {
    changeField('klipyKey', value);
  };

  const handleTelegramTokenInput = (value: string) => {
    changeField('telegramToken', value);
  };

  const handleSaveClick = () => {
    void save();
  };

  return (
    <>
      <ViewHeader>
        <ViewTitle title="Настройки" />
      </ViewHeader>

      <ViewBody view={SETTINGS_VIEW}>
        <div className="flex flex-col gap-2 px-0.5 pb-3 pt-1">
          <SecretField
            id="settings-giphy-key"
            label="GIPHY API key"
            value={giphyKey}
            onInput={handleGiphyKeyInput}
          >
            Бесплатно на{' '}
            <ExternalLink href="https://developers.giphy.com/dashboard/">
              developers.giphy.com
            </ExternalLink>
          </SecretField>

          <SecretField
            id="settings-klipy-key"
            label="KLIPY API key"
            value={klipyKey}
            onInput={handleKlipyKeyInput}
          >
            Тестовый ключ в Partner Panel:{' '}
            <ExternalLink href="https://klipy.com/migrate">klipy.com</ExternalLink>
          </SecretField>

          <SecretField
            id="settings-telegram-token"
            label="Токен Telegram-бота (для импорта)"
            value={telegramToken}
            onInput={handleTelegramTokenInput}
          >
            Создайте любого бота в{' '}
            <ExternalLink href="https://t.me/BotFather">@BotFather</ExternalLink>. Токен
            хранится локально.
          </SecretField>

          <div className="flex items-center gap-1.5">
            <Button variant="primary" onClick={handleSaveClick}>
              Сохранить
            </Button>
          </div>
        </div>
      </ViewBody>
    </>
  );
};
