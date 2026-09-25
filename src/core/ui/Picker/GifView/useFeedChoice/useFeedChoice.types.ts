import type { GifFeed } from '../../../../sources/gifs.types';

export type FeedChoice = {
  /**
   * Источники, для которых сохранены ключи; пусто — ключей нет.
   */
  feeds: GifFeed[];

  /**
   * Выбранный источник; `null` — ключей нет.
   */
  feed: GifFeed | null;

  /**
   * Выбирает источник ленты.
   */
  selectFeed: (feed: GifFeed) => void;
};
