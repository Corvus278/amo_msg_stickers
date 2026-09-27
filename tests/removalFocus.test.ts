import { describe, expect, it } from 'vitest';

import {
  cellRemovalTargets,
  resolveFocusTarget,
  sectionRemovalTargets,
} from '../src/core/ui/Picker/StickersMode/removalFocus/removalFocus';
import type { FocusSection } from '../src/core/ui/Picker/StickersMode/removalFocus/removalFocus.types';

/**
 * Раздел с ячейками по ключам.
 *
 * @param id — идентификатор раздела
 * @param keys — ключи ячеек в порядке показа
 * @returns раздел
 */
const section = (id: string, keys: string[]): FocusSection => {
  return {
    id,
    items: keys.map((key) => {
      return { key };
    }),
  };
};

const BEFORE = [
  section('recent', ['r1', 'r2']),
  section('custom', ['a', 'b', 'c']),
  section('tg:cats', ['x']),
];

describe('cellRemovalTargets', () => {
  it('сначала следующая ячейка раздела, затем предыдущая, затем вкладки', () => {
    expect(cellRemovalTargets(BEFORE, 'custom', 'b')).toEqual([
      { kind: 'cell', sectionId: 'custom', key: 'c' },
      { kind: 'cell', sectionId: 'custom', key: 'a' },
      { kind: 'tab', sectionId: 'custom' },
      { kind: 'tab', sectionId: 'tg:cats' },
      { kind: 'tab', sectionId: 'recent' },
    ]);
  });

  it('у последней ячейки раздела следующей нет', () => {
    expect(cellRemovalTargets(BEFORE, 'custom', 'c').slice(0, 2)).toEqual([
      { kind: 'cell', sectionId: 'custom', key: 'b' },
      { kind: 'tab', sectionId: 'custom' },
    ]);
  });

  it('неизвестная ячейка — целей нет', () => {
    expect(cellRemovalTargets(BEFORE, 'custom', 'zzz')).toEqual([]);
    expect(cellRemovalTargets(BEFORE, 'nope', 'a')).toEqual([]);
  });
});

describe('sectionRemovalTargets', () => {
  it('вкладка следующего раздела, затем предыдущего', () => {
    expect(sectionRemovalTargets(BEFORE, 'custom')).toEqual([
      { kind: 'tab', sectionId: 'tg:cats' },
      { kind: 'tab', sectionId: 'recent' },
    ]);
  });

  it('у последнего раздела — только предыдущий', () => {
    expect(sectionRemovalTargets(BEFORE, 'tg:cats')).toEqual([
      { kind: 'tab', sectionId: 'custom' },
    ]);
  });
});

describe('resolveFocusTarget', () => {
  it('следующая ячейка осталась — фокус на неё', () => {
    const after = [section('recent', ['r1', 'r2']), section('custom', ['a', 'c'])];

    expect(resolveFocusTarget(cellRemovalTargets(BEFORE, 'custom', 'b'), after)).toEqual({
      kind: 'cell',
      sectionId: 'custom',
      key: 'c',
    });
  });

  it('раздел опустел и исчез — вкладка соседнего раздела', () => {
    const after = [section('custom', ['a', 'b', 'c']), section('tg:cats', ['x'])];
    const targets = cellRemovalTargets(
      [section('recent', ['r1']), ...BEFORE.slice(1)],
      'recent',
      'r1'
    );

    expect(resolveFocusTarget(targets, after)).toEqual({
      kind: 'tab',
      sectionId: 'custom',
    });
  });

  it('раздел пака опустел, но остался — его вкладка', () => {
    const after = [...BEFORE.slice(0, 2), section('tg:cats', [])];

    expect(resolveFocusTarget(cellRemovalTargets(BEFORE, 'tg:cats', 'x'), after)).toEqual(
      {
        kind: 'tab',
        sectionId: 'tg:cats',
      }
    );
  });

  it('удалённый пак — вкладка следующего раздела', () => {
    const after = [section('recent', ['r1']), section('tg:cats', ['x'])];

    expect(resolveFocusTarget(sectionRemovalTargets(BEFORE, 'custom'), after)).toEqual({
      kind: 'tab',
      sectionId: 'tg:cats',
    });
  });

  it('ни одной цели не осталось — null', () => {
    expect(resolveFocusTarget([{ kind: 'tab', sectionId: 'gone' }], BEFORE)).toBeNull();
  });
});
