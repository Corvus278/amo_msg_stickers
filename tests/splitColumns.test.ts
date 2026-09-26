import { describe, expect, it } from 'vitest';

import { splitColumns } from '../src/core/ui/Picker/MasonryGrid/splitColumns/splitColumns';
import type { SizedItem } from '../src/core/ui/Picker/MasonryGrid/splitColumns/splitColumns.types';

type Item = SizedItem & {
  /**
   * Номер в порядке выдачи.
   */
  id: number;
};

/**
 * Элемент ленты с номером и размерами.
 *
 * @param id — номер в порядке выдачи
 * @param width — ширина
 * @param height — высота
 * @returns элемент
 */
const item = (id: number, width: number, height: number): Item => {
  return { id, width, height };
};

/**
 * Номера элементов по колонкам — так раскладку проще сравнивать.
 *
 * @param columns — колонки
 * @returns номера по колонкам
 */
const ids = (columns: Item[][]): number[][] => {
  return columns.map((column) => {
    return column.map(({ id }) => {
      return id;
    });
  });
};

describe('splitColumns', () => {
  it('одинаковые элементы идут по порядку слева направо, строка за строкой', () => {
    const items = [0, 1, 2, 3, 4].map((id) => {
      return item(id, 100, 100);
    });

    expect(ids(splitColumns(items, 2))).toEqual([
      [0, 2, 4],
      [1, 3],
    ]);
  });

  it('следующий элемент уходит в более короткую колонку', () => {
    const items = [
      item(0, 100, 300),
      item(1, 100, 100),
      item(2, 100, 100),
      item(3, 100, 100),
    ];

    expect(ids(splitColumns(items, 2))).toEqual([[0], [1, 2, 3]]);
  });

  it('высота считается по пропорциям, а не по пикселям', () => {
    const items = [item(0, 400, 200), item(1, 100, 100), item(2, 100, 100)];

    expect(ids(splitColumns(items, 2))).toEqual([[0, 2], [1]]);
  });

  it('дописанная страница не сдвигает уже разложенные элементы', () => {
    const first = [
      item(0, 100, 150),
      item(1, 100, 80),
      item(2, 200, 100),
      item(3, 100, 120),
    ];
    const next = [item(4, 100, 100), item(5, 300, 100), item(6, 100, 200)];

    const before = ids(splitColumns(first, 2));
    const after = ids(splitColumns([...first, ...next], 2));

    after.forEach((column, index) => {
      expect(column.slice(0, before[index]?.length)).toEqual(before[index]);
    });
  });

  it('без элементов — пустые колонки', () => {
    expect(splitColumns([], 3)).toEqual([[], [], []]);
  });
});
