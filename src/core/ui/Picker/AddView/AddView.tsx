import type { FunctionComponent as FC } from 'preact';

import { CreateSticker } from './CreateSticker/CreateSticker';
import { TelegramImport } from './TelegramImport/TelegramImport';

/**
 * Добавление стикеров: импорт пака из Telegram и свой стикер из файла. `data-view` —
 * метка для проверки переключения на стенде.
 */
export const AddView: FC = () => {
  return (
    <>
      <div className="flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5">
        <div className="flex min-h-5.5 items-center gap-2">
          <span className="flex-1 truncate font-semibold">Добавить стикеры</span>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]"
        data-view="add"
      >
        <div className="flex flex-col gap-2 px-0.5 pb-3 pt-1">
          <TelegramImport />

          <CreateSticker />
        </div>
      </div>
    </>
  );
};
