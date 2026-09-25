import type { FunctionComponent as FC } from 'preact';

import { Button } from '../Button/Button';

import { ExternalLink } from './ExternalLink/ExternalLink';
import { SecretField } from './SecretField/SecretField';
import { useSettingsDraft } from './useSettingsDraft/useSettingsDraft';

/**
 * Ключи GIPHY и KLIPY и токен Telegram-бота. Сохранённые значения сразу применяются в
 * ленте GIF и импорте, без перезагрузки страницы. `data-view` — метка для проверки
 * переключения на стенде.
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
      <div className="flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5">
        <div className="flex min-h-5.5 items-center gap-2">
          <span className="flex-1 truncate font-semibold">Настройки</span>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]"
        data-view="settings"
      >
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
      </div>
    </>
  );
};
