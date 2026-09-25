import type { FunctionComponent as FC, TargetedKeyboardEvent } from 'preact';

import { usePickerView } from '../usePickerView/usePickerView';

import { isSameView } from './isSameView';
import { moveTabFocus } from './moveTabFocus';
import type { TabProps } from './Tab.types';
import { TAB_PANEL_ID, tabId } from './tabIds';

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
  const { view: currentView, switchTo } = usePickerView();
  const isSelected = isSameView(view, currentView);

  const handleTabClick = () => {
    switchTo(view);
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
