import type { RemoteGif } from '../db.types';
import type { Host, Settings } from '../host.types';
import { isAllowedUrl } from '../net';

import {
  type GifFeed,
  type GifPage,
  type GiphyImage,
  type GiphyKind,
  isGiphyImage,
  isGiphyItem,
  isGiphyResponse,
  isTenorMedia,
  isTenorResponse,
  isTenorResult,
  type TenorMedia,
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

/**
 * Рендишны по убыванию предпочтения. `original` GIPHY отдаёт почти всегда, остальные — не
 * у каждого GIF.
 */
const GIPHY_PREVIEW_RENDITIONS = ['fixed_width_small', 'fixed_width', 'original'];
const GIPHY_SEND_RENDITIONS = ['downsized', 'original'];
const KLIPY_PREVIEW_FORMATS = ['tinygif', 'gif'];
const KLIPY_SEND_FORMATS = ['gif', 'tinygif'];

/**
 * Первый пригодный вариант файла: правильной формы и со ссылкой в пределах сетевой
 * политики. null — ни один не подошёл, элемент выдачи отбрасывается.
 *
 * @param variants — варианты файла по имени
 * @param names — имена по убыванию предпочтения
 * @param isVariant — гард формы варианта
 * @returns вариант или null
 */
const pickVariant = <T extends GiphyImage | TenorMedia>(
  variants: Record<string, unknown>,
  names: string[],
  isVariant: (value: unknown) => value is T
): T | null => {
  for (const name of names) {
    const variant = variants[name];

    if (isVariant(variant) && isAllowedUrl(variant.url)) return variant;
  }

  return null;
};

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
  const response = await host.fetchJson(`${GIPHY_BASE}/${kind}/${endpoint}?${params}`);

  if (!isGiphyResponse(response)) throw new Error('GIPHY: неожиданный ответ');
  const { data, pagination } = response;

  const items = data.reduce<RemoteGif[]>((acc, item) => {
    if (!isGiphyItem(item)) return acc;
    const preview = pickVariant(item.images, GIPHY_PREVIEW_RENDITIONS, isGiphyImage);
    const send = pickVariant(item.images, GIPHY_SEND_RENDITIONS, isGiphyImage);

    if (preview && send) {
      acc.push({
        id: item.id,
        provider: 'giphy',
        title: item.title || undefined,
        url: send.url,
        previewUrl: preview.url,
        width: Number(preview.width),
        height: Number(preview.height),
      });
    }

    return acc;
  }, []);
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
  const response = await host.fetchJson(`${KLIPY_BASE}/${endpoint}?${params}`);

  if (!isTenorResponse(response)) throw new Error('KLIPY: неожиданный ответ');
  const { results, next: nextPos } = response;

  const items = results.reduce<RemoteGif[]>((acc, result) => {
    if (!isTenorResult(result)) return acc;
    const formats = result.media_formats;
    const preview = pickVariant(formats, KLIPY_PREVIEW_FORMATS, isTenorMedia);
    const send = pickVariant(formats, KLIPY_SEND_FORMATS, isTenorMedia);

    if (preview && send) {
      const [width, height] = preview.dims;

      acc.push({
        id: result.id,
        provider: 'klipy',
        title: result.content_description || undefined,
        url: send.url,
        previewUrl: preview.url,
        width,
        height,
      });
    }

    return acc;
  }, []);

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
