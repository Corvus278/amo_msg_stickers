import type { FunctionComponent as FC } from 'preact';

import { Button } from '../../Button/Button';
import { TextInput } from '../../TextInput/TextInput';
import { useTelegramImport } from '../../useTelegramImport/useTelegramImport';

import { ImportProgress } from './ImportProgress/ImportProgress';

/**
 * Форма импорта пака из Telegram. Возвращает фрагмент, а не обёртку: заголовок, строка
 * ввода и прогресс — строки общей формы вкладки «Добавить стикеры» с её отступами.
 */
export const TelegramImport: FC = () => {
  const { link, changeLink, isImporting, percent, startImport } = useTelegramImport();

  const handleLinkInput = (value: string) => {
    changeLink(value);
  };

  const handleImportClick = () => {
    void startImport();
  };

  return (
    <>
      <h3 className="mt-1.5 text-xsm font-bold">Импорт из Telegram</h3>

      <p className="text-xs leading-[1.4] text-cadetGray-30 dark:text-gray-70">
        Ссылка на пак. Статичные, анимированные (.tgs) и видео-стикеры конвертируются в
        GIF.
      </p>

      <div className="flex items-center gap-1.5">
        <TextInput
          type="text"
          value={link}
          placeholder="t.me/addstickers/…"
          onInput={handleLinkInput}
        />

        <Button variant="primary" isDisabled={isImporting} onClick={handleImportClick}>
          Импорт
        </Button>
      </div>

      {percent !== null && <ImportProgress percent={percent} />}
    </>
  );
};
