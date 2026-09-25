import type { FunctionComponent as FC, TargetedEvent } from 'preact';
import { useState } from 'preact/hooks';

import type { GifFeed } from '../../../sources/gifs.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { MasonryGrid } from '../MasonryGrid/MasonryGrid';
import { usePicker } from '../PickerProvider/usePicker';
import { TextInput } from '../TextInput/TextInput';
import { useGifFeed } from '../useGifFeed/useGifFeed';
import { usePickerView } from '../usePickerView/usePickerView';
import type { View } from '../usePickerView/usePickerView.types';
import { ViewBody } from '../ViewBody/ViewBody';
import { ViewHeader } from '../ViewHeader/ViewHeader';

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

const GIFS_VIEW: View = { kind: 'gifs' };

/**
 * Кнопка в виде ссылки: `href="#"` у `<a>` запрещён jsx-a11y, а действие — переход во
 * вкладку, а не навигация.
 */
const SETTINGS_LINK_CLASS =
  'cursor-pointer border-0 bg-transparent p-0 text-blue-50 underline dark:text-beige-70';

/**
 * Поиск GIF и трендовая выдача выбранного источника. Без ключей — подсказка с переходом
 * в настройки.
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

  const handleBodyScroll = (event: TargetedEvent<HTMLDivElement>) => {
    checkScroll(event.currentTarget);
  };

  if (!feed) {
    return (
      <>
        <ViewHeader />

        <ViewBody view={GIFS_VIEW}>
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
        </ViewBody>
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

      <ViewBody view={GIFS_VIEW} onScroll={handleBodyScroll}>
        {isNothingFound ? (
          <EmptyState>Ничего не нашлось</EmptyState>
        ) : (
          <MasonryGrid gifs={gifs} />
        )}

        <div className="px-0.5 pt-1 text-right text-xxs text-cadetGray-30 dark:text-gray-70">
          {FEED_ATTRIBUTION[feed]}
        </div>
      </ViewBody>
    </>
  );
};
