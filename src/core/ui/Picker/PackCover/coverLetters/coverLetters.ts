/**
 * Длина подписи вкладки пака без обложки: больше двух букв в 34px вкладки не влезает.
 */
const TITLE_LETTERS = 2;

/**
 * Буквы — графемы, а не единицы UTF-16: срез строки разорвал бы эмодзи из названия пака
 * Telegram, и во вкладке встал бы битый символ.
 */
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Подпись вкладки пака без обложки.
 *
 * @param title — название пака
 * @returns первые две буквы названия; эмодзи — одна буква
 */
export const coverLetters = (title: string): string => {
  let letters = '';
  let count = 0;

  for (const { segment } of GRAPHEME_SEGMENTER.segment(title)) {
    if (count === TITLE_LETTERS) break;

    letters += segment;
    count += 1;
  }

  return letters;
};
