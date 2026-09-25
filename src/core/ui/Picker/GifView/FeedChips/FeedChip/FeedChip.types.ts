import type { GifFeed } from '../../../../../sources/gifs.types';

export type FeedChipProps = {
  /**
   * Источник, который выбирает чип.
   */
  feed: GifFeed;

  /**
   * Источник выбран: чип залит акцентным цветом.
   */
  isSelected: boolean;

  /**
   * Колбэк на выбор источника.
   */
  onSelect: (feed: GifFeed) => void;
};
