import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '../src/core/host';
import { BYTES_IN_MB as MB } from '../src/core/net';
import { fetchGifs } from '../src/core/sources/gifs';

import { fakeHost } from './helpers/fakeHost';

const SETTINGS = { ...DEFAULT_SETTINGS, giphyKey: 'g', klipyKey: 'k' };

const giphyImage = (url: string) => {
  return { url, width: '200', height: '100' };
};

const giphyPage = (data: unknown[]) => {
  return { data, pagination: { offset: 0, count: data.length, total_count: 100 } };
};

const tenorMedia = (url: string) => {
  return { url, dims: [220, 110] };
};

/**
 * Вес версии по имени: число — в МБ, строка — сырое значение поля `size`, null — поля нет.
 */
type Sizes = Record<string, number | string | null>;

/**
 * Элемент выдачи GIPHY с весом у каждого рендишна. Превью — `fixed_width_small` без веса:
 * к версии для отправки оно отношения не имеет.
 *
 * @param sizes — вес рендишна по имени
 * @param extra — рендишны, добавленные как есть
 * @returns ответ API
 */
const giphyWeighted = (sizes: Sizes, extra: Record<string, unknown> = {}) => {
  const images = Object.entries(sizes).reduce<Record<string, unknown>>(
    (acc, [name, size]) => {
      const image = giphyImage(`https://media.giphy.com/w/${name}.gif`);

      acc[name] =
        size === null
          ? image
          : {
              ...image,
              size: typeof size === 'number' ? String(Math.round(size * MB)) : size,
            };

      return acc;
    },
    { fixed_width_small: giphyImage('https://media.giphy.com/w/preview.gif'), ...extra }
  );

  return giphyPage([{ id: 'w', images }]);
};

/**
 * Ответ KLIPY с одним элементом и весом у каждого формата.
 *
 * @param sizes — вес формата по имени
 * @param extra — форматы, добавленные как есть
 * @returns ответ API
 */
const klipyWeighted = (sizes: Sizes, extra: Record<string, unknown> = {}) => {
  const formats = Object.entries(sizes).reduce<Record<string, unknown>>(
    (acc, [name, size]) => {
      const media = tenorMedia(`https://static.klipy.com/w/${name}.gif`);

      acc[name] =
        size === null
          ? media
          : { ...media, size: typeof size === 'number' ? Math.round(size * MB) : size };

      return acc;
    },
    { ...extra }
  );

  return { results: [{ id: 'w', media_formats: formats }] };
};

const sentUrl = async (json: unknown, feed: 'giphy-gifs' | 'klipy') => {
  const { items } = await fetchGifs(fakeHost({ json }), SETTINGS, feed, '', null);

  return items[0]?.url;
};

describe('fetchGifs: GIPHY', () => {
  it('нормализует элемент выдачи', async () => {
    const host = fakeHost({
      json: giphyPage([
        {
          id: 'a',
          images: {
            fixed_width_small: giphyImage('https://media.giphy.com/a/small.gif'),
            downsized: giphyImage('https://media.giphy.com/a/downsized.gif'),
            original: giphyImage('https://media.giphy.com/a/original.gif'),
          },
        },
      ]),
    });

    const page = await fetchGifs(host, SETTINGS, 'giphy-gifs', '', null);

    expect(page).toEqual({
      items: [
        {
          id: 'a',
          provider: 'giphy',
          url: 'https://media.giphy.com/a/downsized.gif',
          previewUrl: 'https://media.giphy.com/a/small.gif',
          width: 200,
          height: 100,
        },
      ],
      next: '1',
    });
  });

  it('отбрасывает элемент без рендишна и элемент с чужим хостом', async () => {
    const host = fakeHost({
      json: giphyPage([
        { id: 'no-images', images: {} },
        { id: 'evil', images: { original: giphyImage('https://evil.example/x.gif') } },
        { id: 'broken' },
        { id: 'ok', images: { original: giphyImage('https://i.giphy.com/ok.gif') } },
      ]),
    });

    const { items } = await fetchGifs(host, SETTINGS, 'giphy-stickers', 'кот', null);

    expect(
      items.map(({ id }) => {
        return id;
      })
    ).toEqual(['ok']);
  });

  it.each([
    {},
    { data: [] },
    { data: 'x', pagination: { offset: 0, count: 0, total_count: 0 } },
    { data: [], pagination: {} },
    { data: [], pagination: { offset: '0', count: 0, total_count: 0 } },
    null,
    'html',
  ])('битый ответ %j — ошибка источника', async (json) => {
    await expect(
      fetchGifs(fakeHost({ json }), SETTINGS, 'giphy-gifs', '', null)
    ).rejects.toThrow('GIPHY: неожиданный ответ');
  });
});

describe('fetchGifs: версия GIPHY для отправки по весу', () => {
  it('версия до 2 МБ побеждает тяжёлую', async () => {
    const json = giphyWeighted({ original: 7, downsized: 1.9, fixed_height: 1.4 });

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/downsized.gif'
    );
  });

  it('из нескольких до 2 МБ — самая тяжёлая', async () => {
    const json = giphyWeighted({
      original: 5,
      fixed_height: 1.2,
      fixed_width: 1.8,
      fixed_height_small: 0.3,
    });

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/fixed_width.gif'
    );
  });

  it('нет версии до 2 МБ — самая лёгкая до 8 МБ', async () => {
    const json = giphyWeighted({ original: 11, downsized_large: 7, downsized_medium: 3 });

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/downsized_medium.gif'
    );
  });

  it('все тяжелее 8 МБ — самая лёгкая', async () => {
    const json = giphyWeighted({ original: 12, downsized_large: 9 });

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/downsized_large.gif'
    );
  });

  it('равный вес — первая по списку кандидатов', async () => {
    const json = giphyWeighted({ fixed_width: 1.5, fixed_height: 1.5 });

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/fixed_height.gif'
    );
  });

  it('версия с весом вне сетевой политики пропускается', async () => {
    const json = giphyWeighted(
      { original: 7, fixed_height: 1.4 },
      {
        downsized: {
          ...giphyImage('https://evil.example/downsized.gif'),
          size: String(1.9 * MB),
        },
      }
    );

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/fixed_height.gif'
    );
  });

  it.each([null, 'abc', '0', '-1'])(
    'выдача без пригодного веса (%j) — прежний выбор по имени',
    async (size) => {
      const json = giphyWeighted({ original: size, downsized: size, fixed_height: size });

      expect(await sentUrl(json, 'giphy-gifs')).toBe(
        'https://media.giphy.com/w/downsized.gif'
      );
    }
  );

  it('вес числом, а не строкой, — веса нет', async () => {
    const json = giphyWeighted(
      {},
      {
        original: { ...giphyImage('https://media.giphy.com/w/original.gif'), size: 5000 },
        downsized: {
          ...giphyImage('https://media.giphy.com/w/downsized.gif'),
          size: 1000,
        },
      }
    );

    expect(await sentUrl(json, 'giphy-gifs')).toBe(
      'https://media.giphy.com/w/downsized.gif'
    );
  });
});

describe('fetchGifs: KLIPY', () => {
  it('нормализует элемент и курсор', async () => {
    const host = fakeHost({
      json: {
        results: [
          {
            id: 'k',
            media_formats: {
              tinygif: tenorMedia('https://static.klipy.com/k/tiny.gif'),
              gif: tenorMedia('https://static.klipy.com/k/full.gif'),
            },
          },
        ],
        next: 'CURSOR',
      },
    });

    const page = await fetchGifs(host, SETTINGS, 'klipy', '', null);

    expect(page).toEqual({
      items: [
        {
          id: 'k',
          provider: 'klipy',
          url: 'https://static.klipy.com/k/full.gif',
          previewUrl: 'https://static.klipy.com/k/tiny.gif',
          width: 220,
          height: 110,
        },
      ],
      next: 'CURSOR',
    });
  });

  it('отбрасывает элемент со ссылкой вне klipy.com и без dims', async () => {
    const host = fakeHost({
      json: {
        results: [
          {
            id: 'evil',
            media_formats: { gif: tenorMedia('https://cdn.evil.example/x.gif') },
          },
          {
            id: 'no-dims',
            media_formats: { gif: { url: 'https://static.klipy.com/x.gif' } },
          },
        ],
      },
    });

    const page = await fetchGifs(host, SETTINGS, 'klipy', 'кот', 'CURSOR');

    expect(page).toEqual({ items: [], next: null });
  });

  it('битый ответ — ошибка источника', async () => {
    await expect(
      fetchGifs(fakeHost({ json: { results: {} } }), SETTINGS, 'klipy', '', null)
    ).rejects.toThrow('KLIPY: неожиданный ответ');
  });

  it('запрашивает все форматы-кандидаты', async () => {
    const urls: string[] = [];
    const host = fakeHost({
      onJson: (url) => {
        urls.push(url);

        return { results: [] };
      },
    });

    await fetchGifs(host, SETTINGS, 'klipy', 'кот', null);

    expect(new URL(urls[0] || '').searchParams.get('media_filter')).toBe(
      'gif,mediumgif,tinygif,nanogif'
    );
  });
});

describe('fetchGifs: версия KLIPY для отправки по весу', () => {
  it('версия до 2 МБ побеждает тяжёлые', async () => {
    const json = klipyWeighted({ gif: 13, mediumgif: 5, tinygif: 1.4 });

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/tinygif.gif');
  });

  it('из нескольких до 2 МБ — самая тяжёлая', async () => {
    const json = klipyWeighted({ gif: 9, mediumgif: 1.9, tinygif: 0.5, nanogif: 0.1 });

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/mediumgif.gif');
  });

  it('нет версии до 2 МБ — самая лёгкая до 8 МБ', async () => {
    const json = klipyWeighted({ gif: 13, mediumgif: 3, tinygif: 5 });

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/mediumgif.gif');
  });

  it('все тяжелее 8 МБ — самая лёгкая', async () => {
    const json = klipyWeighted({ gif: 17, mediumgif: 10 });

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/mediumgif.gif');
  });

  it('равный вес — первая по списку кандидатов', async () => {
    const json = klipyWeighted({ tinygif: 1, gif: 1 });

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/gif.gif');
  });

  it('версия с весом вне сетевой политики пропускается', async () => {
    const json = klipyWeighted(
      { gif: 13, tinygif: 0.5 },
      {
        mediumgif: {
          ...tenorMedia('https://cdn.evil.example/medium.gif'),
          size: 1.9 * MB,
        },
      }
    );

    expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/tinygif.gif');
  });

  /**
   * Без `gif` прежний выбор по имени даёт `tinygif`, а выбор по весу при равном весе —
   * `mediumgif`: так тест отличает «веса нет» от «вес принят».
   */
  it.each([null, 'abc', '1000', 0, -1])(
    'выдача без пригодного веса (%j) — прежний выбор по имени',
    async (size) => {
      const json = klipyWeighted({ mediumgif: size, tinygif: size });

      expect(await sentUrl(json, 'klipy')).toBe('https://static.klipy.com/w/tinygif.gif');
    }
  );
});
