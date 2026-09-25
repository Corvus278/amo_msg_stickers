import type { RemoteGif } from '../db.types';
import { isObject } from '../guards';

export type GifFeed = 'giphy-gifs' | 'giphy-stickers' | 'klipy';

/**
 * Раздел GIPHY: у GIF и стикеров разные эндпоинты с одинаковой формой ответа.
 */
export type GiphyKind = 'gifs' | 'stickers';

export type GifPage = {
  /**
   * GIF текущей страницы выдачи.
   */
  items: RemoteGif[];

  /**
   * Курсор следующей страницы. null — выдача закончилась.
   */
  next: string | null;
};

export type GiphyImage = {
  /**
   * Ссылка на GIF-рендишн.
   */
  url: string;

  /**
   * Ширина в пикселях — GIPHY отдаёт числа строками.
   */
  width: string;

  /**
   * Высота в пикселях — GIPHY отдаёт числа строками.
   */
  height: string;
};

export type GiphyItem = {
  /**
   * Идентификатор GIF в GIPHY.
   */
  id: string;

  /**
   * Рендишны по имени (`original`, `downsized`, `fixed_width` …); набор зависит от GIF,
   * каждый проверяется `isGiphyImage` при выборе.
   */
  images: Record<string, unknown>;
};

export type GiphyPagination = {
  /**
   * Смещение текущей страницы.
   */
  offset: number;

  /**
   * Сколько элементов пришло на странице.
   */
  count: number;

  /**
   * Всего элементов в выдаче.
   */
  total_count: number;
};

export type GiphyResponse = {
  /**
   * GIF страницы выдачи; каждый элемент проверяется `isGiphyItem`.
   */
  data: unknown[];

  /**
   * Положение страницы в выдаче.
   */
  pagination: GiphyPagination;
};

export type TenorMedia = {
  /**
   * Ссылка на файл формата.
   */
  url: string;

  /**
   * Размеры в пикселях: [ширина, высота].
   */
  dims: [number, number];
};

export type TenorResult = {
  /**
   * Идентификатор GIF в KLIPY.
   */
  id: string;

  /**
   * Файлы по формату (`gif`, `tinygif`); приходят только запрошенные в `media_filter`,
   * каждый проверяется `isTenorMedia` при выборе.
   */
  media_formats: Record<string, unknown>;
};

export type TenorResponse = {
  /**
   * GIF страницы выдачи; каждый элемент проверяется `isTenorResult`.
   */
  results: unknown[];

  /**
   * Курсор следующей страницы. Пустая строка или нет поля — выдача закончилась.
   */
  next?: string;
};

/**
 * Гарды проверяют только то, что код читает дальше: лишние поля ответа не мешают,
 * а без нужных элемент или страница выдачи бесполезны.
 */

const isPositiveNumeric = (value: unknown) => {
  return typeof value === 'string' && Number(value) > 0;
};

export const isGiphyImage = (value: unknown): value is GiphyImage => {
  return (
    isObject(value) &&
    'url' in value &&
    typeof value.url === 'string' &&
    'width' in value &&
    isPositiveNumeric(value.width) &&
    'height' in value &&
    isPositiveNumeric(value.height)
  );
};

export const isGiphyItem = (value: unknown): value is GiphyItem => {
  return (
    isObject(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    'images' in value &&
    isObject(value.images)
  );
};

export const isGiphyResponse = (value: unknown): value is GiphyResponse => {
  return (
    isObject(value) &&
    'data' in value &&
    Array.isArray(value.data) &&
    'pagination' in value &&
    isObject(value.pagination) &&
    'offset' in value.pagination &&
    typeof value.pagination.offset === 'number' &&
    'count' in value.pagination &&
    typeof value.pagination.count === 'number' &&
    'total_count' in value.pagination &&
    typeof value.pagination.total_count === 'number'
  );
};

export const isTenorMedia = (value: unknown): value is TenorMedia => {
  return (
    isObject(value) &&
    'url' in value &&
    typeof value.url === 'string' &&
    'dims' in value &&
    Array.isArray(value.dims) &&
    value.dims.length === 2 &&
    value.dims.every((dim) => {
      return typeof dim === 'number' && dim > 0;
    })
  );
};

export const isTenorResult = (value: unknown): value is TenorResult => {
  return (
    isObject(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    'media_formats' in value &&
    isObject(value.media_formats)
  );
};

export const isTenorResponse = (value: unknown): value is TenorResponse => {
  return (
    isObject(value) &&
    'results' in value &&
    Array.isArray(value.results) &&
    (!('next' in value) || typeof value.next === 'string')
  );
};
