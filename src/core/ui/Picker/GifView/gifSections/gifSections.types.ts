import type { RemoteGif } from '../../../../db.types';
import type { FeedLoading } from '../../useGifFeed/useGifFeed.types';

export type GifSectionsInput = {
  /**
   * Недавно отправленные GIF, свежие первыми.
   */
  recent: RemoteGif[];

  /**
   * Загруженная выдача источника: тренды или результаты поиска.
   */
  gifs: RemoteGif[];

  /**
   * Запрос, по которому загружена выдача; пустая строка — тренды.
   */
  term: string;

  /**
   * Есть ли источник: без ключей выдачи нет.
   */
  hasFeed: boolean;

  /**
   * Какая страница выдачи грузится; `null` — ничего не грузится.
   */
  loading: FeedLoading | null;
};
