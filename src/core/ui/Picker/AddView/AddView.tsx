import type { FunctionComponent as FC } from 'preact';

import type { View } from '../usePickerView/usePickerView.types';
import { ViewBody } from '../ViewBody/ViewBody';
import { ViewHeader } from '../ViewHeader/ViewHeader';
import { ViewTitle } from '../ViewHeader/ViewTitle/ViewTitle';

import { CreateSticker } from './CreateSticker/CreateSticker';
import { TelegramImport } from './TelegramImport/TelegramImport';

const ADD_VIEW: View = { kind: 'add' };

/**
 * Добавление стикеров: импорт пака из Telegram и свой стикер из файла.
 */
export const AddView: FC = () => {
  return (
    <>
      <ViewHeader>
        <ViewTitle title="Добавить стикеры" />
      </ViewHeader>

      <ViewBody view={ADD_VIEW}>
        <div className="flex flex-col gap-2 px-0.5 pb-3 pt-1">
          <TelegramImport />

          <CreateSticker />
        </div>
      </ViewBody>
    </>
  );
};
