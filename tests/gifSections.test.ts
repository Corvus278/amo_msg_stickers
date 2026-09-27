import { describe, expect, it } from 'vitest';

import type { RecentRec, RemoteGif } from '../src/core/db.types';
import {
  gifSections,
  recentGifs,
} from '../src/core/ui/Picker/GifView/gifSections/gifSections';

/**
 * GIF из выдачи с номером.
 *
 * @param id — номер GIF у провайдера
 * @returns GIF
 */
const gif = (id: string): RemoteGif => {
  return {
    id,
    provider: 'giphy',
    url: `https://media.giphy.com/${id}.gif`,
    previewUrl: `https://media.giphy.com/${id}-preview.gif`,
    width: 200,
    height: 100,
  };
};

const RECENT = [gif('r1'), gif('r2')];
const TRENDS = [gif('t1'), gif('t2'), gif('t3')];

describe('gifSections', () => {
  it('при пустом запросе ставит недавние с заголовком над трендами', () => {
    const sections = gifSections({
      recent: RECENT,
      gifs: TRENDS,
      term: '',
      hasFeed: true,
      loading: null,
    });

    expect(sections).toEqual([
      { id: 'recent', title: 'Недавние', items: RECENT, skeletons: 0, isRecent: true },
      { id: 'feed', title: 'Тренды', items: TRENDS, skeletons: 0, isRecent: false },
    ]);
  });

  it('без недавних показывает тренды без заголовка', () => {
    const sections = gifSections({
      recent: [],
      gifs: TRENDS,
      term: '',
      hasFeed: true,
      loading: null,
    });

    expect(sections).toEqual([
      { id: 'feed', title: '', items: TRENDS, skeletons: 0, isRecent: false },
    ]);
  });

  it('при непустом запросе раздела недавних нет', () => {
    const sections = gifSections({
      recent: RECENT,
      gifs: TRENDS,
      term: 'кот',
      hasFeed: true,
      loading: null,
    });

    expect(sections).toEqual([
      { id: 'feed', title: '', items: TRENDS, skeletons: 0, isRecent: false },
    ]);
  });

  it('без ключей оставляет только недавние', () => {
    const sections = gifSections({
      recent: RECENT,
      gifs: [],
      term: '',
      hasFeed: false,
      loading: null,
    });

    expect(sections).toEqual([
      { id: 'recent', title: 'Недавние', items: RECENT, skeletons: 0, isRecent: true },
    ]);
  });

  it('при первой загрузке выдачи ставит восемь заглушек — поровну в каждую колонку', () => {
    const sections = gifSections({
      recent: RECENT,
      gifs: [],
      term: '',
      hasFeed: true,
      loading: 'first',
    });

    expect(sections).toEqual([
      { id: 'recent', title: 'Недавние', items: RECENT, skeletons: 0, isRecent: true },
      { id: 'feed', title: 'Тренды', items: [], skeletons: 4, isRecent: false },
    ]);
  });

  it('при подгрузке страницы ставит по заглушке в конец каждой колонки', () => {
    const sections = gifSections({
      recent: [],
      gifs: TRENDS,
      term: '',
      hasFeed: true,
      loading: 'more',
    });

    expect(sections).toEqual([
      { id: 'feed', title: '', items: TRENDS, skeletons: 1, isRecent: false },
    ]);
  });

  it('без ключей и без недавних разделов нет', () => {
    expect(
      gifSections({ recent: [], gifs: [], term: '', hasFeed: false, loading: null })
    ).toEqual([]);
  });
});

describe('recentGifs', () => {
  it('берёт GIF из записей недавних в их порядке и пропускает стикеры', () => {
    const records: RecentRec[] = [
      { key: 'r:giphy:r2', ts: 3, item: { kind: 'remote', gif: RECENT[1] as RemoteGif } },
      { key: 'l:s1', ts: 2, item: { kind: 'local', stickerId: 's1' } },
      { key: 'r:giphy:r1', ts: 1, item: { kind: 'remote', gif: RECENT[0] as RemoteGif } },
    ];

    expect(recentGifs(records)).toEqual([RECENT[1], RECENT[0]]);
  });
});
