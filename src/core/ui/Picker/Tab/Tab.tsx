import type { FunctionComponent as FC, TargetedKeyboardEvent } from 'preact';

import { moveTabFocus } from '../moveTabFocus/moveTabFocus';
import { usePicker } from '../PickerProvider/usePicker';
import { TAB_PANEL_ID, tabId } from '../tabIds/tabIds';
import { RECENT_SECTION_ID } from '../usePickerView/sectionIds';
import { usePickerView } from '../usePickerView/usePickerView';

import { currentView } from './currentView';
import { isSameView } from './isSameView';
import type { TabProps } from './Tab.types';

/**
 * Шрифт задаётся явно: подпись «GIF» и буквы пака без обложки — 11px жирным, мельче
 * текста панели.
 */
const TAB_CLASS = [
  'flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
  'font-primary text-[11px] font-semibold leading-none',
  'text-cadetGray-30 hover:bg-cadetGray-30/[.14] dark:text-gray-70 dark:hover:bg-white-0/[.07]',
  'aria-selected:bg-cadetGray-30/[.14] aria-selected:text-blue-50',
  'dark:aria-selected:bg-white-0/[.07] dark:aria-selected:text-beige-70',
].join(' ');

/**
 * Вкладка паттерна ARIA tabs: в порядке Tab стоит только выбранная (roving tabindex),
 * между вкладками ходят стрелками, `Home` и `End`.
 */
export const Tab: FC<TabProps> = (props) => {
  const { title, view, children } = props;
  const { packs } = usePicker();
  const pickerView = usePickerView();
  const { setMode, openScreen, scrollToSection } = pickerView;
  const isSelected = isSameView(view, currentView(pickerView, packs));

  const handleTabClick = () => {
    switch (view.kind) {
      case 'recent': {
        scrollToSection(RECENT_SECTION_ID);
        break;
      }

      case 'pack': {
        scrollToSection(view.packId);
        break;
      }

      case 'gifs': {
        setMode('gifs');
        break;
      }

      case 'add':

      case 'settings': {
        openScreen(view.kind);
        break;
      }

      default: {
        const unknownView: never = view;

        throw new Error(`Unknown picker view: ${JSON.stringify(unknownView)}`);
      }
    }
  };

  const handleTabKeyDown = (event: TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (moveTabFocus(event.key, event.currentTarget)) event.preventDefault();
  };

  return (
    <button
      type="button"
      role="tab"
      id={tabId(view)}
      title={title}
      aria-selected={isSelected}
      aria-controls={TAB_PANEL_ID}
      tabIndex={isSelected ? 0 : -1}
      className={TAB_CLASS}
      onClick={handleTabClick}
      onKeyDown={handleTabKeyDown}
    >
      {children}
    </button>
  );
};
