import { createGifEncoder } from './gifEncoder';
import type { GifEncoder } from './gifEncoder.types';
import type { GifWorkerPost, GifWorkerRequest } from './gifWorker.types';

/**
 * Кодировщик текущего прохода; без открытого прохода кадр или `finish` — ошибка
 * протокола, а не тихий пропуск.
 *
 * @param encoder — кодировщик прохода или `undefined`, если прохода нет
 * @returns кодировщик прохода
 */
const requireEncoder = (encoder: GifEncoder | undefined) => {
  if (!encoder) throw new Error('GIF worker: no pass started');

  return encoder;
};

/**
 * Обработчик сообщений Worker-а кодирования. Отделён от глобального `self`, чтобы
 * протокол проверялся в `node`: точка входа `gifWorkerEntry.ts` только подключает его
 * к сообщениям Worker-а.
 *
 * На каждый кадр — `ack` с весом, на `finish` — `done` с байтами GIF. Любая ошибка
 * уходит сообщением `error` и закрывает проход: кадры после неё тоже ответят `error`,
 * пока не придёт новый `start`.
 *
 * @param post — отправка ответа главному потоку
 * @returns обработчик одного сообщения
 */
export const createGifWorkerHandler = (post: GifWorkerPost) => {
  let encoder: GifEncoder | undefined;

  /**
   * Выполняет одно сообщение протокола.
   *
   * @param request — сообщение главного потока
   */
  const handle = (request: GifWorkerRequest) => {
    switch (request.type) {
      case 'start': {
        const { width, height, isAnimated } = request;

        encoder = createGifEncoder({ width, height, isAnimated });

        return;
      }

      case 'frame': {
        const active = requireEncoder(encoder);

        active.write(request.rgba, request.delayMs);
        post({ type: 'ack', byteLength: active.byteLength });

        return;
      }

      case 'finish': {
        const bytes = requireEncoder(encoder).finish();

        encoder = undefined;
        post({ type: 'done', bytes }, [bytes.buffer]);

        return;
      }

      default: {
        const unknownRequest: never = request;
        const { type }: Pick<GifWorkerRequest, 'type'> = unknownRequest;

        throw new Error(`GIF worker: unknown message type ${type}`);
      }
    }
  };

  return (request: GifWorkerRequest) => {
    try {
      handle(request);
    } catch (error) {
      encoder = undefined;
      post({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
};
