import type { FunctionComponent as FC } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import type { RemoteGif } from '../../../db.types';
import type { GifFeed } from '../../../sources/gifs.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { MasonryGrid } from '../MasonryGrid/MasonryGrid';
import { usePicker } from '../PickerProvider/usePicker';
import { TextInput } from '../TextInput/TextInput';
import { useGifFeed } from '../useGifFeed/useGifFeed';
import { usePickerView } from '../usePickerView/usePickerView';
import { ViewHeader } from '../ViewHeader/ViewHeader';

import { FeedChips } from './FeedChips/FeedChips';
import { gifSections } from './gifSections/gifSections';
import { useFeedChoice } from './useFeedChoice/useFeedChoice';
import { useRecentGifs } from './useRecentGifs/useRecentGifs';
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
 * Кнопка в виде ссылки: `href="#"` у `<a>` запрещён jsx-a11y, а действие — открытие
 * экрана, а не навигация.
 */
const SETTINGS_LINK_CLASS =
  'cursor-pointer border-0 bg-transparent p-0 text-blue-50 underline dark:text-beige-70';

/**
 * Поиск GIF и трендовая выдача выбранного источника, при пустом запросе над ней — недавние GIF.
 * Без ключей — недавние и подсказка с переходом в настройки.
 */
export const GifView: FC<GifViewProps> = (props) => {
  const { isOpen } = props;
  const { settings } = usePicker();
  const { openScreen } = usePickerView();
  const { feeds, feed, selectFeed } = useFeedChoice(settings);
  const [query, setQuery] = useState('');
  const { gifs, term, loading, isNothingFound, resetId, checkScroll } = useGifFeed(
    feed,
    query,
    isOpen
  );
  const { recent, remove, clear } = useRecentGifs(isOpen);
  const searchRef = useSearchFocus(isOpen);
  const hasFeed = Boolean(feed);

  const sections = useMemo(() => {
    return gifSections({ recent, gifs, term, hasFeed, loading });
  }, [recent, gifs, term, hasFeed, loading]);

  const handleSettingsClick = () => {
    openScreen('settings');
  };

  const handleSearchInput = (value: string) => {
    setQuery(value);
  };

  const handleFeedSelect = (nextFeed: GifFeed) => {
    selectFeed(nextFeed);
  };

  const handleGridScroll = (element: HTMLElement) => {
    checkScroll(element);
  };

  const handleRecentRemove = (gif: RemoteGif) => {
    void remove(gif);
  };

  const handleRecentClear = () => {
    void clear();
  };

  if (!feed) {
    return (
      <>
        <ViewHeader />

        <MasonryGrid
          sections={sections}
          resetKey={resetId}
          onScroll={handleGridScroll}
          onRecentRemove={handleRecentRemove}
          onRecentClear={handleRecentClear}
        >
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
        </MasonryGrid>
      </>
    );
  }

  return (
    <>
      <ViewHeader>
        <TextInput
          type="search"
          value={query}
          placeholder="Поиск GIF"
          inputRef={searchRef}
          onInput={handleSearchInput}
        />

        <FeedChips feeds={feeds} feed={feed} onSelect={handleFeedSelect} />
      </ViewHeader>

      <MasonryGrid
        sections={sections}
        resetKey={resetId}
        onScroll={handleGridScroll}
        onRecentRemove={handleRecentRemove}
        onRecentClear={handleRecentClear}
      >
        {isNothingFound && <EmptyState>Ничего не нашлось</EmptyState>}

        <div className="px-0.5 pt-1 text-right text-xxs text-cadetGray-30 dark:text-gray-70">
          {FEED_ATTRIBUTION[feed]}
        </div>
      </MasonryGrid>
    </>
  );
};
