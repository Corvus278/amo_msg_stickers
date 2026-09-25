import type { RemoteGif } from '../db.types';

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
   * Название GIF; пустая строка — названия нет.
   */
  title?: string;

  /**
   * Рендишны по имени (`original`, `downsized`, `fixed_width` …); набор зависит от GIF.
   */
  images: Record<string, GiphyImage | undefined>;
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
   * GIF страницы выдачи.
   */
  data: GiphyItem[];

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
   * Описание GIF; нет или пустая строка — описания нет.
   */
  content_description?: string;

  /**
   * Файлы по формату (`gif`, `tinygif`); приходят только запрошенные в `media_filter`.
   */
  media_formats: Record<string, TenorMedia | undefined>;
};

export type TenorResponse = {
  /**
   * GIF страницы выдачи.
   */
  results: TenorResult[];

  /**
   * Курсор следующей страницы. Пустая строка — выдача закончилась.
   */
  next: string;
};
