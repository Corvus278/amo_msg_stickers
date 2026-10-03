import { afterEach, describe, expect, it } from 'vitest';

import type { Pack, RecentRec, StickerRec, StickersByPack } from '../src/core/db.types';
import { setLocale } from '../src/core/i18n/translate';
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

afterEach(() => {
  setLocale('ru');
});

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

  it('пак без стикеров — раздел без ячеек: у «Моих стикеров» плитка без подсказки, у пака — «Пак пуст» без плитки', () => {
    const [custom, packA] = feedSections(PACKS, new Map([['tg:a', []]]), []);

    expect(custom?.items).toEqual([]);
    expect(custom?.hasCreateTile).toBe(true);
    expect(custom?.hint).toBe('');
    expect(packA?.items).toEqual([]);
    expect(packA?.hasCreateTile).toBe(false);
    expect(packA?.hint).toBe('Пак пуст');
  });

  it('плитка «Создать стикер» — только у «Моих стикеров», и со стикерами тоже', () => {
    const sections = feedSections(
      PACKS,
      new Map([...BY_PACK, ['custom', [sticker('c1', 'custom')]]]),
      [recent('a1')]
    );

    expect(
      sections.map(({ id, hasCreateTile }) => {
        return [id, hasCreateTile];
      })
    ).toEqual([
      ['recent', false],
      ['custom', true],
      ['tg:a', false],
      ['tg:b', false],
    ]);
  });

  it('стикеры пака идут в порядке группы, с отправкой своего стикера и именем по эмодзи', () => {
    const [, packA] = feedSections(PACKS, BY_PACK, []);

    expect(packA?.items).toEqual([
      {
        key: 'a1',
        item: { kind: 'local', stickerId: 'a1' },
        sticker: BY_PACK.get('tg:a')?.[0],
        name: {
          send: 'Отправить стикер 😀',
          menu: 'Действия: стикер 😀',
          preview: 'Предпросмотр стикера 😀',
        },
      },
      {
        key: 'a2',
        item: { kind: 'local', stickerId: 'a2' },
        sticker: BY_PACK.get('tg:a')?.[1],
        name: {
          send: 'Отправить стикер',
          menu: 'Действия: стикер',
          preview: 'Предпросмотр стикера',
        },
      },
    ]);
  });

  it('имя своего стикера содержит его подпись', () => {
    const captioned: StickerRec = { ...sticker('c1', 'custom'), caption: 'Привет' };
    const [custom] = feedSections(PACKS, new Map([['custom', [captioned]]]), []);

    expect(custom?.items[0]?.name.send).toBe('Отправить стикер «Привет»');
  });

  it('на английском — английские названия и подсказки, названия паков Telegram без перевода', () => {
    setLocale('en');

    const captioned: StickerRec = { ...sticker('c1', 'custom'), caption: 'hi' };
    const sections = feedSections(
      [...PACKS, pack('tg:c', 'Коты')],
      new Map([
        ['custom', [captioned]],
        ['tg:a', [sticker('a1', 'tg:a')]],
      ]),
      [recent('a1')]
    );

    expect(
      sections.map(({ id, title, hint }) => {
        return [id, title, hint];
      })
    ).toEqual([
      ['recent', 'Recent', ''],
      ['custom', 'My stickers', ''],
      ['tg:a', 'A', 'Pack is empty'],
      ['tg:b', 'B', 'Pack is empty'],
      ['tg:c', 'Коты', 'Pack is empty'],
    ]);
    expect(sections[1]?.items[0]?.name.send).toBe('Send sticker “hi”');
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
