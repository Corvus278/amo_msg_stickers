import type { EntryBox } from './feedEntry.types';

/**
 * Элемент ленты, на который встаёт фокус при входе в неё с клавиатуры: первый видимый целиком
 * при Tab, последний — при Shift+Tab. Видимый только частично не подходит: браузер докрутил бы
 * ленту до него.
 *
 * @param boxes — фокусируемые элементы ленты в порядке документа
 * @param view — видимая область ленты
 * @param isBackward — вход по Shift+Tab
 * @returns номер элемента; −1 — ни один не виден целиком
 */
export const entryIndex = (
  boxes: readonly EntryBox[],
  view: EntryBox,
  isBackward: boolean
): number => {
  const isInView = ({ top, bottom }: EntryBox) => {
    return top >= view.top && bottom <= view.bottom;
  };

  if (!isBackward) return boxes.findIndex(isInView);

  for (let index = boxes.length - 1; index >= 0; index -= 1) {
    const box = boxes[index];

    if (box && isInView(box)) return index;
  }

  return -1;
};
