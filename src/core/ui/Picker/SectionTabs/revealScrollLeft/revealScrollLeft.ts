import type { StripBox, TabBox } from './revealScrollLeft.types';

/**
 * Прокрутка полосы, при которой вкладка видна целиком вместе с отступом полосы, — со сдвигом на
 * минимум: вкладка левее видимой части встаёт к левому краю, правее — к правому, видимая не
 * двигает полосу. Первая вкладка так открывает начало полосы, последняя — её конец.
 *
 * Считается вручную, а не `scrollIntoView`: тот прокрутил бы вместе с полосой и страницу amo.
 *
 * @param tab — место вкладки в полосе
 * @param strip — видимая часть полосы
 * @returns новая прокрутка полосы вбок
 */
export const revealScrollLeft = (tab: TabBox, strip: StripBox): number => {
  const { left, width } = tab;
  const { scrollLeft, width: stripWidth, inset } = strip;
  const start = left - inset;
  const end = left + width + inset;

  if (start < scrollLeft) return Math.max(start, 0);

  if (end > scrollLeft + stripWidth) return end - stripWidth;

  return scrollLeft;
};
