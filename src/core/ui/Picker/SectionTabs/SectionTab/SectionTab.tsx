import type { FunctionComponent as FC, TargetedKeyboardEvent } from 'preact';

import { moveTabFocus } from '../../moveTabFocus/moveTabFocus';
import { FEED_PANEL_ID } from '../sectionTabIds';

import type { SectionTabProps } from './SectionTab.types';

/**
 * Шрифт задаётся явно: буквы пака без обложки — 11px жирным, мельче текста панели.
 *
 * Выбранная вкладка — ещё и черта под ней (`after`): подложку вкладки пака почти целиком
 * закрывает обложка. Черта лежит в нижнем отступе полосы, а не в вкладке — обложку она не
 * перекрывает.
 */
const TAB_CLASS = [
  'relative flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent p-1',
  'font-primary text-[11px] font-semibold leading-none',
  'text-cadetGray-30 hover:bg-cadetGray-30/[.14] dark:text-gray-70 dark:hover:bg-white-0/[.07]',
  'aria-selected:bg-cadetGray-30/[.14] aria-selected:text-blue-50',
  'dark:aria-selected:bg-white-0/[.07] dark:aria-selected:text-beige-70',
  'after:absolute after:inset-x-2 after:-bottom-1 after:h-0.5 after:rounded-full',
  'aria-selected:after:bg-blue-50 dark:aria-selected:after:bg-beige-70',
].join(' ');

/**
 * Вкладка полосы разделов по паттерну ARIA tabs: в порядке Tab стоит одна вкладка полосы, между
 * вкладками ходят стрелками, `Home` и `End`, выбирают — кликом, Enter или пробелом.
 */
export const SectionTab: FC<SectionTabProps> = (props) => {
  const { id, title, isSelected, isFocusable, onSelect, children } = props;

  const handleTabClick = () => {
    onSelect();
  };

  const handleTabKeyDown = (event: TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (moveTabFocus(event.key, event.currentTarget)) event.preventDefault();
  };

  return (
    <button
      type="button"
      role="tab"
      id={id}
      title={title}
      aria-selected={isSelected}
      aria-controls={FEED_PANEL_ID}
      tabIndex={isFocusable ? 0 : -1}
      className={TAB_CLASS}
      onClick={handleTabClick}
      onKeyDown={handleTabKeyDown}
    >
      {children}
    </button>
  );
};
