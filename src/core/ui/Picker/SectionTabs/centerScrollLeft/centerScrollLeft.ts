import type { StripBox, TabBox } from './centerScrollLeft.types';

/**
 * Прокрутка полосы вбок, при которой центр вкладки стоит в центре видимой части полосы.
 *
 * Итог зажат в пределы прокрутки: у начала и конца полосы вкладка встаёт настолько близко к
 * центру, насколько позволяет прокрутка, и внутренний отступ полосы открывается вместе с краем.
 * Полоса без переполнения всегда получает `0`.
 *
 * Считается вручную, а не `scrollIntoView({ inline: 'center' })`: тот прокрутил бы вместе с
 * полосой и страницу amo.
 *
 * @param tab — место вкладки в полосе
 * @param strip — размеры полосы
 * @returns новая прокрутка полосы вбок
 */
export const centerScrollLeft = (tab: TabBox, strip: StripBox): number => {
  const { left, width } = tab;
  const { width: stripWidth, scrollWidth } = strip;
  const maxScrollLeft = Math.max(scrollWidth - stripWidth, 0);
  const centered = left + width / 2 - stripWidth / 2;

  return Math.min(Math.max(centered, 0), maxScrollLeft);
};
