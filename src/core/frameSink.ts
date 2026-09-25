import type { FrameSink } from './frameSink.types';
import type { GifEncoderOptions } from './gifEncoder.types';
import { createGifWorkerSink } from './workerSink';

/**
 * Приёмник кадров одного прохода. Вызывающий зовёт `close` при любом исходе прохода.
 *
 * @param options — размер кадра и признак анимации
 * @returns приёмник кадров
 */
export const createFrameSink = (options: GifEncoderOptions): FrameSink => {
  return createGifWorkerSink(options);
};
