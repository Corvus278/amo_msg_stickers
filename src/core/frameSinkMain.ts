import type { FrameSink } from './frameSink.types';
import { createGifEncoder } from './gifEncoder';
import type { GifEncoderOptions } from './gifEncoder.types';

/**
 * Отдаёт поток странице до следующего кадра: без этого весь проход шёл бы одной задачей
 * главного потока и страница не отвечала бы на ввод.
 *
 * @returns промис, разрешённый в следующей задаче цикла событий
 */
const yieldToPage = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Приёмник кадров на главном потоке — для окружения, где Worker не запустился. Кодирует
 * тем же потоковым кодировщиком, что и Worker, и уступает поток после каждого кадра:
 * подряд главный поток занят одним кадром, а не всем проходом.
 *
 * @param options — размер кадра и признак анимации
 * @returns приёмник кадров
 */
export const createMainThreadSink = (options: GifEncoderOptions): FrameSink => {
  const encoder = createGifEncoder(options);

  return {
    write: async (rgba, delayMs) => {
      encoder.write(rgba, delayMs);
      await yieldToPage();
    },
    get byteLength() {
      return encoder.byteLength;
    },
    finish: async () => {
      return encoder.finish();
    },

    /**
     * Держать нечего: кодировщик и его поток уходят вместе с приёмником.
     */
    close: () => {},
  };
};
