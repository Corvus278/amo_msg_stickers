import type { FunctionComponent as FC } from 'preact';

import { usePickerView } from '../usePickerView/usePickerView';

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

export const Tab: FC<TabProps> = (props) => {
  const { title, view, children } = props;
  const { view: currentView, switchTo } = usePickerView();

  const handleTabClick = () => {
    switchTo(view);
  };

  return (
    <button
      type="button"
      role="tab"
      title={title}
      aria-selected={isSameView(view, currentView)}
      className={TAB_CLASS}
      onClick={handleTabClick}
    >
      {children}
    </button>
  );
};
