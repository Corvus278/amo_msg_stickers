import type { SizedItem } from './splitColumns.types';

/**
 * Раскладывает элементы по колонкам равной ширины: каждый следующий — в самую короткую
 * колонку, при равенстве — в левую. Так лента читается в порядке выдачи слева направо и
 * сверху вниз, а не колонка за колонкой, как у CSS `columns`.
 *
 * Место элемента зависит только от элементов перед ним: дописанная в конец страница не
 * сдвигает уже показанные.
 *
 * Высота колонки считается в долях её ширины, без зазоров между ячейками: ширина колонки
 * в пикселях до рендера неизвестна, а зазор в долях без неё не выразить. Колонка с большим
 * числом ячеек выходит на несколько пикселей на ячейку длиннее расчётной.
 *
 * @param items — элементы в порядке выдачи
 * @param count — число колонок, больше нуля
 * @returns колонки слева направо, в каждой — элементы сверху вниз
 */
export const splitColumns = <T extends SizedItem>(items: T[], count: number): T[][] => {
  const columns = Array.from({ length: count }, (): T[] => {
    return [];
  });
  const heights = columns.map(() => {
    return 0;
  });

  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));

    columns[shortest]?.push(item);
    heights[shortest] = (heights[shortest] || 0) + item.height / item.width;
  }

  return columns;
};
