import type { DecodeFeedImagesOptions, FeedImage } from './decodeFeedImages.types';

/**
 * Битая или снятая до конца декодирования картинка ожидание не обрывает: лента едет дальше, а
 * ячейка покажет то же, что показала бы без подготовки.
 *
 * @param image — картинка ячейки
 */
const decodeQuietly = async (image: FeedImage): Promise<void> => {
  try {
    await image.decode();
  } catch {
    /**
     * Ошибка декодирования — та же готовность: ждать больше нечего.
     */
  }
};

/**
 * Ждёт, пока картинки ленты в полосе `[top, bottom)` декодируются, но не дольше потолка.
 *
 * Картинка, декодированная до показа, рисуется в первом же кадре, где она видна; без этого лента
 * после мгновенного перехода несколько кадров стоит пустой, пока декодер догоняет весь экран.
 *
 * @param options — лента, полоса в координатах прокрутки и потолок ожидания
 */
export const decodeFeedImages = async (
  options: DecodeFeedImagesOptions
): Promise<void> => {
  const { element, top, bottom, ceilingMs } = options;
  const offset = element.scrollTop - element.getBoundingClientRect().top;
  const decodes = [...element.querySelectorAll('img')].reduce<Promise<void>[]>(
    (acc, image) => {
      const rect = image.getBoundingClientRect();

      if (rect.bottom + offset > top && rect.top + offset < bottom) {
        acc.push(decodeQuietly(image));
      }

      return acc;
    },
    []
  );
  let timer = 0;
  const ceiling = new Promise<void>((resolve) => {
    timer = window.setTimeout(resolve, ceilingMs);
  });

  await Promise.race([Promise.all(decodes), ceiling]);
  window.clearTimeout(timer);
};
