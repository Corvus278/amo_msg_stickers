import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '../src/core/host';
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

  it.each([{}, { data: [] }, { data: 'x', pagination: {} }, null, 'html'])(
    'битый ответ %j — ошибка источника',
    async (json) => {
      await expect(
        fetchGifs(fakeHost({ json }), SETTINGS, 'giphy-gifs', '', null)
      ).rejects.toThrow('GIPHY: неожиданный ответ');
    }
  );
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
});
