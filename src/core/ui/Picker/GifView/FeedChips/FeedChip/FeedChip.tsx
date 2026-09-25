import type { FunctionComponent as FC } from 'preact';

import { FEED_LABELS } from '../../../../../sources/gifs';

import type { FeedChipProps } from './FeedChip.types';

/**
 * Выбранный чип — вариантом `aria-pressed:`: состояние читается из того же атрибута,
 * который слышит скринридер.
 */
const CHIP_CLASS = [
  'cursor-pointer rounded-xl border-0 px-[9px] py-[3px] text-xs',
  'bg-cadetGray-30/[.12] text-cadetGray-30 dark:bg-white-0/[.06] dark:text-gray-70',
  'aria-pressed:bg-blue-50 aria-pressed:text-white-0',
  'dark:aria-pressed:bg-beige-70 dark:aria-pressed:text-gray-10',
].join(' ');

export const FeedChip: FC<FeedChipProps> = (props) => {
  const { feed, isSelected, onSelect } = props;

  const handleChipClick = () => {
    onSelect(feed);
  };

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={CHIP_CLASS}
      onClick={handleChipClick}
    >
      {FEED_LABELS[feed]}
    </button>
  );
};
