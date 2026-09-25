import type { RemoteGif } from '../db.types';
import type { Host, Settings } from '../host.types';

import type {
  GifFeed,
  GifPage,
  GiphyKind,
  GiphyResponse,
  TenorResponse,
} from './gifs.types';

export const FEED_LABELS: Record<GifFeed, string> = {
  'giphy-gifs': 'GIPHY',
  'giphy-stickers': 'GIPHY стикеры',
  klipy: 'KLIPY',
};

export const availableFeeds = ({ giphyKey, klipyKey }: Settings): GifFeed[] => {
  const feeds: GifFeed[] = [];

  if (giphyKey) feeds.push('giphy-gifs', 'giphy-stickers');
  if (klipyKey) feeds.push('klipy');

  return feeds;
};

const PAGE_SIZE = 24;

const GIPHY_BASE = 'https://api.giphy.com/v1';
const GIPHY_RATING = 'pg-13';

/**
 * KLIPY v2 повторяет Tenor v2 (Tenor API закрыт Google 30.06.2026).
 */
const KLIPY_BASE = 'https://api.klipy.com/v2';
const KLIPY_CLIENT_KEY = 'amo-stickers';

/**
 * `tinygif` — превью в сетке пикера, `gif` — файл для отправки.
 */
const KLIPY_MEDIA_FILTER = 'gif,tinygif';
const KLIPY_CONTENT_FILTER = 'medium';

const giphy = async (
  host: Host,
  key: string,
  kind: GiphyKind,
  q: string,
  next: string | null
): Promise<GifPage> => {
  const params = new URLSearchParams({
    api_key: key,
    limit: String(PAGE_SIZE),
    offset: String(Number(next || 0)),
    rating: GIPHY_RATING,
  });

  if (q) params.set('q', q);
  const endpoint = q ? 'search' : 'trending';
  const { data, pagination } = await host.fetchJson<GiphyResponse>(
    `${GIPHY_BASE}/${kind}/${endpoint}?${params}`
  );

  const items = data.map(({ id, images }): RemoteGif => {
    /**
     * `original` GIPHY отдаёт у каждого GIF, остальные рендишны — не всегда.
     */
    const preview = images.fixed_width_small || images.fixed_width || images.original!;
    const send = images.downsized || images.original!;

    return {
      id,
      provider: 'giphy',
      url: send.url,
      previewUrl: preview.url,
      width: Number(preview.width),
      height: Number(preview.height),
    };
  });
  const consumed = pagination.offset + pagination.count;

  return { items, next: consumed < pagination.total_count ? String(consumed) : null };
};

const klipy = async (
  host: Host,
  key: string,
  q: string,
  next: string | null
): Promise<GifPage> => {
  const params = new URLSearchParams({
    key,
    client_key: KLIPY_CLIENT_KEY,
    limit: String(PAGE_SIZE),
    media_filter: KLIPY_MEDIA_FILTER,
    contentfilter: KLIPY_CONTENT_FILTER,
  });

  if (q) params.set('q', q);
  if (next) params.set('pos', next);
  const endpoint = q ? 'search' : 'featured';
  const { results, next: nextPos } = await host.fetchJson<TenorResponse>(
    `${KLIPY_BASE}/${endpoint}?${params}`
  );

  const items = results.map(({ id, media_formats: formats }): RemoteGif => {
    /**
     * `gif` запрошен в `media_filter` и приходит у каждого результата.
     */
    const preview = formats.tinygif || formats.gif!;
    const send = formats.gif || preview;
    const [width, height] = preview.dims;

    return {
      id,
      provider: 'klipy',
      url: send.url,
      previewUrl: preview.url,
      width,
      height,
    };
  });

  return { items, next: nextPos || null };
};

export const fetchGifs = (
  host: Host,
  { giphyKey, klipyKey }: Settings,
  feed: GifFeed,
  q: string,
  next: string | null
): Promise<GifPage> => {
  switch (feed) {
    case 'giphy-gifs': {
      return giphy(host, giphyKey, 'gifs', q, next);
    }

    case 'giphy-stickers': {
      return giphy(host, giphyKey, 'stickers', q, next);
    }

    case 'klipy': {
      return klipy(host, klipyKey, q, next);
    }

    default: {
      throw new Error(`Unknown feed: ${String(feed)}`);
    }
  }
};
