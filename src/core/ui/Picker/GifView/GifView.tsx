import type { FunctionComponent as FC, JSX } from 'preact';
import { useState } from 'preact/hooks';

import type { GifFeed } from '../../../sources/gifs.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { MasonryGrid } from '../MasonryGrid/MasonryGrid';
import { usePicker } from '../PickerProvider/usePicker';
import { TextInput } from '../TextInput/TextInput';
import { useGifFeed } from '../useGifFeed/useGifFeed';
import { usePickerView } from '../usePickerView/usePickerView';

import { FeedChips } from './FeedChips/FeedChips';
import { useFeedChoice } from './useFeedChoice/useFeedChoice';
import { useSearchFocus } from './useSearchFocus/useSearchFocus';
import type { GifViewProps } from './GifView.types';

/**
 * Подпись источника под лентой — условие использования API у обоих провайдеров.
 */
const FEED_ATTRIBUTION: Record<GifFeed, string> = {
  'giphy-gifs': 'Powered by GIPHY',
  'giphy-stickers': 'Powered by GIPHY',
  klipy: 'Powered by KLIPY',
};

/**
 * Шапка повторяет шапку `RecentView`: отступы общие у всех представлений, и тело панели
 * не прыгает при переключении вкладок. Без ключей шапка пустая, но место под неё
 * остаётся.
 */
const HEAD_CLASS = 'flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5';

const BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]';

/**
 * Кнопка в виде ссылки: `href="#"` у `<a>` запрещён jsx-a11y, а действие — переход во
 * вкладку, а не навигация.
 */
const SETTINGS_LINK_CLASS =
  'cursor-pointer border-0 bg-transparent p-0 text-blue-50 underline dark:text-beige-70';

/**
 * Поиск GIF и трендовая выдача выбранного источника. Без ключей — подсказка с переходом
 * в настройки. `data-view` — метка для проверки переключения на стенде.
 */
export const GifView: FC<GifViewProps> = (props) => {
  const { isOpen } = props;
  const { settings } = usePicker();
  const { switchTo } = usePickerView();
  const { feeds, feed, selectFeed } = useFeedChoice(settings);
  const [query, setQuery] = useState('');
  const { gifs, isNothingFound, checkScroll } = useGifFeed(feed, query, isOpen);
  const searchRef = useSearchFocus(isOpen);

  const handleSettingsClick = () => {
    switchTo({ kind: 'settings' });
  };

  const handleSearchInput = (value: string) => {
    setQuery(value);
  };

  const handleFeedSelect = (nextFeed: GifFeed) => {
    selectFeed(nextFeed);
  };

  const handleBodyScroll = (event: JSX.TargetedEvent<HTMLDivElement>) => {
    checkScroll(event.currentTarget);
  };

  if (!feed) {
    return (
      <>
        <div className={HEAD_CLASS} />

        <div className={BODY_CLASS} data-view="gifs">
          <EmptyState>
            Для поиска GIF нужен API-ключ GIPHY или KLIPY.
            <br />
            <button
              type="button"
              className={SETTINGS_LINK_CLASS}
              onClick={handleSettingsClick}
            >
              Открыть настройки
            </button>
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={HEAD_CLASS}>
        <TextInput
          type="search"
          value={query}
          placeholder="Поиск GIF"
          inputRef={searchRef}
          onInput={handleSearchInput}
        />

        <FeedChips feeds={feeds} feed={feed} onSelect={handleFeedSelect} />
      </div>

      <div className={BODY_CLASS} data-view="gifs" onScroll={handleBodyScroll}>
        {isNothingFound ? (
          <EmptyState>Ничего не нашлось</EmptyState>
        ) : (
          <MasonryGrid gifs={gifs} />
        )}

        <div className="px-0.5 pt-1 text-right text-xxs text-cadetGray-30 dark:text-gray-70">
          {FEED_ATTRIBUTION[feed]}
        </div>
      </div>
    </>
  );
};
