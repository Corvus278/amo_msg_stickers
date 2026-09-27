import type { RemoteGif } from '../db.types';
import type { Host, Settings } from '../host.types';
import { isAllowedUrl } from '../net';
import { MAX_GIF_BYTES } from '../sidePick';

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
  type WeightedVariant,
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
 * Все форматы-кандидаты на отправку (`KLIPY_SEND_CANDIDATES`); превью — `tinygif` и `gif` —
 * входят в тот же набор. KLIPY отдаёт только форматы из фильтра, без него — 16 форматов.
 */
const KLIPY_MEDIA_FILTER = 'gif,mediumgif,tinygif,nanogif';
const KLIPY_CONTENT_FILTER = 'medium';

/**
 * Рендишны по убыванию предпочтения: превью и отправка, когда выдача не сообщила вес ни
 * одной версии. `original` GIPHY отдаёт почти всегда, остальные — не у каждого GIF.
 */
const GIPHY_PREVIEW_RENDITIONS = ['fixed_width_small', 'fixed_width', 'original'];
const GIPHY_SEND_RENDITIONS = ['downsized', 'original'];
const KLIPY_PREVIEW_FORMATS = ['tinygif', 'gif'];
const KLIPY_SEND_FORMATS = ['gif', 'tinygif'];

/**
 * Версии GIF для выбора по весу — от крупной к мелкой: порядок решает равенство веса.
 * Не берутся `*_still` (один кадр), `*_downsampled` и `preview_gif` (прореженные кадры),
 * `*_mp4` и `webp` (не GIF).
 */
const GIPHY_SEND_CANDIDATES = [
  'original',
  'downsized_large',
  'downsized_medium',
  'downsized',
  'fixed_height',
  'fixed_width',
  'fixed_height_small',
  'fixed_width_small',
];
const KLIPY_SEND_CANDIDATES = ['gif', 'mediumgif', 'tinygif', 'nanogif'];

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

/**
 * GIPHY отдаёт вес строкой. Нечисловая строка, 0 и отрицательное — веса нет.
 *
 * @param image — рендишн GIPHY
 * @returns вес в байтах или null
 */
const giphyBytes = ({ size }: GiphyImage) => {
  const bytes = typeof size === 'string' ? Number(size) : Number.NaN;

  return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
};

/**
 * KLIPY отдаёт вес числом. Иной тип, 0 и отрицательное — веса нет.
 *
 * @param media — формат KLIPY
 * @returns вес в байтах или null
 */
const klipyBytes = ({ size }: TenorMedia) => {
  return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : null;
};

/**
 * Версия для отправки по весу из ответа источника: самая тяжёлая из не больше
 * `MAX_GIF_BYTES` уходит без конвертации. Если таких нет — самая лёгкая: меньше качать и
 * быстрее пережимать. Самая лёгкая заодно и «самая лёгкая до лимита скачивания», если
 * такая есть; если нет — скачивание оборвётся на лимите с понятной ошибкой. Равный вес —
 * первая по списку. null — ни у одной пригодной версии нет веса, выбор остаётся за
 * `pickVariant`.
 *
 * @param variants — варианты файла по имени
 * @param names — кандидаты от крупной версии к мелкой
 * @param isVariant — гард формы варианта
 * @param bytesOf — вес варианта из ответа; null — веса нет
 * @returns вариант или null
 */
const pickBySize = <T extends GiphyImage | TenorMedia>(
  variants: Record<string, unknown>,
  names: string[],
  isVariant: (value: unknown) => value is T,
  bytesOf: (variant: T) => number | null
): T | null => {
  const weighted = names.reduce<WeightedVariant<T>[]>((acc, name) => {
    const variant = variants[name];

    if (!isVariant(variant) || !isAllowedUrl(variant.url)) return acc;
    const bytes = bytesOf(variant);

    if (bytes !== null) acc.push({ variant, bytes });

    return acc;
  }, []);
  const heaviestFit = weighted.reduce<WeightedVariant<T> | null>((best, candidate) => {
    if (candidate.bytes > MAX_GIF_BYTES) return best;

    return best && best.bytes >= candidate.bytes ? best : candidate;
  }, null);

  if (heaviestFit) return heaviestFit.variant;
  const lightest = weighted.reduce<WeightedVariant<T> | null>((best, candidate) => {
    return best && best.bytes <= candidate.bytes ? best : candidate;
  }, null);

  return lightest ? lightest.variant : null;
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
    const send =
      pickBySize(item.images, GIPHY_SEND_CANDIDATES, isGiphyImage, giphyBytes) ||
      pickVariant(item.images, GIPHY_SEND_RENDITIONS, isGiphyImage);

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
    const send =
      pickBySize(formats, KLIPY_SEND_CANDIDATES, isTenorMedia, klipyBytes) ||
      pickVariant(formats, KLIPY_SEND_FORMATS, isTenorMedia);

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
