import type { GifFeed } from '../../../../sources/gifs.types';

export type FeedChipsProps = {
  /**
   * Источники, для которых сохранены ключи, в порядке переключателя.
   */
  feeds: GifFeed[];

  /**
   * Выбранный источник.
   */
  feed: GifFeed;

  /**
   * Колбэк на выбор источника.
   */
  onSelect: (feed: GifFeed) => void;
};
