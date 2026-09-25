import type { FunctionComponent as FC } from 'preact';

import { usePicker } from '../PickerProvider/usePicker';
import { Tab } from '../Tab/Tab';
import { ClockIcon } from '../TabIcon/ClockIcon/ClockIcon';
import { PlusIcon } from '../TabIcon/PlusIcon/PlusIcon';
import { SettingsIcon } from '../TabIcon/SettingsIcon/SettingsIcon';
import { TabIcon } from '../TabIcon/TabIcon';
import type { View } from '../usePickerView/usePickerView.types';

const RECENT_VIEW: View = { kind: 'recent' };

const GIFS_VIEW: View = { kind: 'gifs' };

const ADD_VIEW: View = { kind: 'add' };

const SETTINGS_VIEW: View = { kind: 'settings' };

/**
 * Полоса прокручивается вбок, когда паков больше, чем влезает, — без видимого
 * скроллбара: он съел бы высоту вкладок.
 */
const TABS_CLASS = [
  'flex shrink-0 items-center gap-0.5 overflow-x-auto px-1.5 py-1 [scrollbar-width:none]',
  'border-t border-cadetGray-30/[.28] dark:border-white-0/10',
].join(' ');

/**
 * Нижняя полоса вкладок: недавние и GIF, паки в порядке добавления, а справа —
 * добавление паков и настройки.
 */
export const Tabs: FC = () => {
  const { packs } = usePicker();

  return (
    <div role="tablist" className={TABS_CLASS}>
      <Tab title="Недавние" view={RECENT_VIEW}>
        <ClockIcon />
      </Tab>

      <Tab title="GIF" view={GIFS_VIEW}>
        GIF
      </Tab>

      {packs.map((pack) => {
        return (
          <Tab key={pack.id} title={pack.title} view={{ kind: 'pack', packId: pack.id }}>
            <TabIcon pack={pack} />
          </Tab>
        );
      })}

      <div aria-hidden="true" className="flex-1" />

      <Tab title="Добавить стикеры" view={ADD_VIEW}>
        <PlusIcon />
      </Tab>

      <Tab title="Настройки" view={SETTINGS_VIEW}>
        <SettingsIcon />
      </Tab>
    </div>
  );
};
