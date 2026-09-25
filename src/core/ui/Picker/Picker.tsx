import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';

import { AddView } from './AddView/AddView';
import { GifView } from './GifView/GifView';
import { PackView } from './PackView/PackView';
import { RecentView } from './RecentView/RecentView';
import { SettingsView } from './SettingsView/SettingsView';
import { StatusBar } from './StatusBar/StatusBar';
import { TAB_PANEL_ID, tabId } from './Tab/tabIds';
import { Tabs } from './Tabs/Tabs';
import { useOpenLoad } from './useOpenLoad/useOpenLoad';
import { usePickerView } from './usePickerView/usePickerView';
import type { View } from './usePickerView/usePickerView.types';
import type { PickerProps } from './Picker.types';

/**
 * Геометрия, тень и радиус повторяют попап эмодзи amo: панель встаёт на его место над
 * правым краем поля ввода.
 *
 * `left-auto m-0 p-0` снимают стили `<dialog>` браузера: без них панель встала бы по
 * центру между `left: 0` и `right`.
 *
 * Шрифт и межстрочный интервал задаются здесь: preflight Tailwind ставит их на `:host`,
 * но `:host { all: initial }` в `picker.css` идёт позже и отменяет и их, и наследование
 * от страницы.
 */
const PANEL_CLASS = [
  'fixed bottom-9.5 right-7.5 z-[2] h-[400px] w-[352px] flex-col overflow-hidden rounded-lgx',
  'left-auto m-0 p-0',
  'font-primary text-xsm leading-[1.3]',
  'bg-white-0 text-gray-30 dark:bg-gray-10 dark:text-gray-40',
  'shadow-[0_3px_7px] shadow-black-0/10 ring-1 ring-cadetGray-30/[.28] dark:ring-white-0/10',
];

/**
 * Анимация открытия — переход из `@starting-style`: панель не размонтируется при
 * закрытии, а переход срабатывает на каждое появление после `display: none`.
 */
const OPEN_ANIMATION_CLASS =
  'transition-[opacity,transform] duration-lg ease-linear [@starting-style]:translate-y-[5px] [@starting-style]:opacity-0';

/**
 * `flex` — только у открытой панели: закрытая остаётся смонтированной и скрыта
 * `display: none`, чтобы вкладка и запрос поиска пережили повторное открытие.
 */
const panelVariants = cva([...PANEL_CLASS, OPEN_ANIMATION_CLASS], {
  variants: {
    isOpen: {
      true: 'flex',
      false: 'hidden',
    },
    isDark: {
      true: 'dark',
    },
  },
});

const renderView = (view: View, isOpen: boolean) => {
  switch (view.kind) {
    case 'recent': {
      return <RecentView isOpen={isOpen} />;
    }

    case 'gifs': {
      return <GifView isOpen={isOpen} />;
    }

    case 'pack': {
      return <PackView packId={view.packId} />;
    }

    case 'add': {
      return <AddView />;
    }

    case 'settings': {
      return <SettingsView />;
    }

    default: {
      const unknownView: never = view;

      throw new Error(`Unknown picker view: ${JSON.stringify(unknownView)}`);
    }
  }
};

export const Picker: FC<PickerProps> = (props) => {
  const { isOpen, isDark, onClose } = props;
  const { view } = usePickerView();

  useOpenLoad(isOpen);

  /**
   * Нажатия не всплывают из попапа: иначе ввод в поиске запускал бы хоткеи amo.
   */
  const handlePanelKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
    event.stopPropagation();
  };

  return (
    <dialog
      open={isOpen}
      aria-label="Стикеры и GIF"
      className={panelVariants({ isOpen, isDark })}
      onKeyDown={handlePanelKeyDown}
    >
      {/**
       * Панель занимает место тела, а шапка и тело представления ложатся в неё так же,
       * как лежали бы прямо в колонке диалога.
       */}
      <div
        role="tabpanel"
        id={TAB_PANEL_ID}
        aria-labelledby={tabId(view)}
        className="flex min-h-0 flex-1 flex-col"
      >
        {renderView(view, isOpen)}
      </div>

      <StatusBar />

      <Tabs />
    </dialog>
  );
};
