import { describe, expect, it } from 'vitest';

import type { Pack, RecentRec, StickerRec, StickersByPack } from '../src/core/db.types';
import { feedSections } from '../src/core/ui/Picker/StickersMode/feedSections/feedSections';

/**
 * Пак с заданным id и названием.
 *
 * @param id — id пака
 * @param title — название
 * @returns пак
 */
const pack = (id: string, title: string): Pack => {
  return { id, title, source: id === 'custom' ? 'custom' : 'telegram', createdAt: 0 };
};

/**
 * Стикер пака с эмодзи.
 *
 * @param id — id стикера
 * @param packId — пак
 * @param emoji — эмодзи стикера
 * @returns запись стикера
 */
const sticker = (id: string, packId: string, emoji?: string): StickerRec => {
  return { id, packId, blob: new Blob(), width: 1, height: 1, emoji, createdAt: 0 };
};

/**
 * Запись недавних своего стикера.
 *
 * @param stickerId — id стикера
 * @returns запись недавних
 */
const recent = (stickerId: string): RecentRec => {
  return { key: `l:${stickerId}`, ts: 0, item: { kind: 'local', stickerId } };
};

const PACKS = [pack('custom', 'Мои стикеры'), pack('tg:a', 'A'), pack('tg:b', 'B')];

const BY_PACK: StickersByPack = new Map([
  ['tg:a', [sticker('a1', 'tg:a', '😀'), sticker('a2', 'tg:a')]],
  ['tg:b', [sticker('b1', 'tg:b')]],
]);

describe('feedSections', () => {
  it('без недавних лента начинается с «Моих стикеров», паки — в порядке списка паков', () => {
    const sections = feedSections(PACKS, BY_PACK, []);

    expect(
      sections.map(({ id, title }) => {
        return [id, title];
      })
    ).toEqual([
      ['custom', 'Мои стикеры'],
      ['tg:a', 'A'],
      ['tg:b', 'B'],
    ]);
  });

  it('пак без стикеров — раздел без ячеек, у «Моих стикеров» подсказка про «+»', () => {
    const [custom, packA] = feedSections(PACKS, new Map([['tg:a', []]]), []);

    expect(custom?.items).toEqual([]);
    expect(custom?.hint).toBe('Создайте свой стикер во вкладке «+»');
    expect(packA?.items).toEqual([]);
    expect(packA?.hint).toBe('Пак пуст');
  });

  it('стикеры пака идут в порядке группы, с отправкой своего стикера и именем по эмодзи', () => {
    const [, packA] = feedSections(PACKS, BY_PACK, []);

    expect(packA?.items).toEqual([
      {
        key: 'a1',
        item: { kind: 'local', stickerId: 'a1' },
        sticker: BY_PACK.get('tg:a')?.[0],
        name: 'стикер 😀',
      },
      {
        key: 'a2',
        item: { kind: 'local', stickerId: 'a2' },
        sticker: BY_PACK.get('tg:a')?.[1],
        name: 'стикер',
      },
    ]);
  });

  it('имя своего стикера содержит его подпись', () => {
    const captioned: StickerRec = { ...sticker('c1', 'custom'), caption: 'Привет' };
    const [custom] = feedSections(PACKS, new Map([['custom', [captioned]]]), []);

    expect(custom?.items[0]?.name).toBe('стикер «Привет»');
  });

  it('недавние — первым разделом в порядке записей, удалённые стикеры и GIF пропускаются', () => {
    const gif: RecentRec = {
      key: 'r:giphy:1',
      ts: 0,
      item: {
        kind: 'remote',
        gif: {
          id: 'giphy:1',
          provider: 'giphy',
          url: 'u',
          previewUrl: 'p',
          width: 1,
          height: 1,
        },
      },
    };
    const [first, second] = feedSections(PACKS, BY_PACK, [
      recent('b1'),
      recent('gone'),
      gif,
      recent('a1'),
    ]);

    expect(first?.id).toBe('recent');
    expect(first?.title).toBe('Недавние');
    expect(
      first?.items.map(({ key }) => {
        return key;
      })
    ).toEqual(['l:b1', 'l:a1']);
    expect(second?.id).toBe('custom');
  });

  it('недавние только из удалённых стикеров — раздела нет', () => {
    const [first] = feedSections(PACKS, BY_PACK, [recent('gone')]);

    expect(first?.id).toBe('custom');
  });
});
