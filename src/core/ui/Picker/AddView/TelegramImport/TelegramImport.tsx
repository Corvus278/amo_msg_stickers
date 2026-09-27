import type { FunctionComponent as FC } from 'preact';

import { t } from '../../../../i18n/translate';
import { USER_DOCS_PAGE, userDocsUrl } from '../../../../userDocs';
import { renderMessage } from '../../../renderMessage/renderMessage';
import { Button } from '../../Button/Button';
import { ExternalLink } from '../../ExternalLink/ExternalLink';
import { TextInput } from '../../TextInput/TextInput';
import { useTelegramImport } from '../../useTelegramImport/useTelegramImport';

import { ImportProgress } from './ImportProgress/ImportProgress';

/**
 * Дока одна, на русском, при любом языке интерфейса: английский текст ссылки говорит об этом сам.
 */
const TELEGRAM_DOCS_URL = userDocsUrl(USER_DOCS_PAGE.telegram);

/**
 * Форма импорта пака из Telegram. Возвращает фрагмент, а не обёртку: заголовок, строка
 * ввода и прогресс — строки общей формы вкладки «Добавить стикеры» с её отступами.
 */
export const TelegramImport: FC = () => {
  const { link, hasLink, changeLink, isImporting, percent, startImport } =
    useTelegramImport();

  const handleLinkInput = (value: string) => {
    changeLink(value);
  };

  const handleImportClick = () => {
    void startImport();
  };

  return (
    <>
      <h3 className="mt-1.5 text-xsm font-bold">{t('add.telegram.title')}</h3>

      <p className="text-xs leading-[1.4] text-cadetGray-30 dark:text-gray-70">
        {renderMessage('add.telegram.hint', {
          docs: (
            <ExternalLink href={TELEGRAM_DOCS_URL}>{t('add.telegram.docs')}</ExternalLink>
          ),
        })}
      </p>

      <div className="flex items-center gap-1.5">
        <TextInput
          type="text"
          value={link}
          placeholder="t.me/addstickers/…"
          onInput={handleLinkInput}
        />

        <Button
          variant="primary"
          isDisabled={isImporting || !hasLink}
          onClick={handleImportClick}
        >
          {t('add.telegram.import')}
        </Button>
      </div>

      {percent !== null && <ImportProgress percent={percent} />}
    </>
  );
};
