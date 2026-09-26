import { GIF_WORKER_CODE } from 'gif-worker:code';

import { createMainThreadSink } from './frameSinkMain';
import { createFallbackAwareSink } from './workerSinkClient';

/**
 * Окно кадров без `ack`. Два кадра: конвейер двухступенчатый — захват на главном потоке
 * и кодирование в Worker-е, — и окно 2 даёт каждой ступени по кадру в работе. Больше
 * не нужно: каждый лишний кадр в полёте — ещё один несжатый кадр в памяти (512×512
 * RGBA — 1 МБ) без измеренного выигрыша.
 *
 * Вес пробы от окна не зависит: проба читает `byteLength` после `flush`, когда `ack`
 * пришёл на каждый её кадр.
 */
const MAX_IN_FLIGHT = 2;

/**
 * Запускает Worker кодирования из blob URL: userscript не может подключить отдельный
 * файл Worker-а. URL отзывается сразу — Worker держит blob с момента создания.
 *
 * @returns запущенный Worker
 */
const startGifWorker = () => {
  const url = URL.createObjectURL(
    new Blob([GIF_WORKER_CODE], { type: 'text/javascript' })
  );

  try {
    return new Worker(url);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Пишет в консоль, почему Worker не заработал, — единственный канал диагностики внутри
 * чужой страницы.
 *
 * @param reason — исключение конструктора или текст сбоя Worker-а
 */
const warnWorkerUnavailable = (reason: unknown) => {
  console.warn('[amo stickers] GIF worker unavailable, encoding on main thread:', reason);
};

/**
 * Приёмник кадров с кодированием в Worker-е, а где Worker не заработал — на главном
 * потоке; после первого сбоя Worker-а фабрика до перезагрузки страницы сразу отдаёт
 * фолбэк. Один Worker на проход: `close` останавливает его, и память кодировщика
 * уходит вместе с ним.
 */
export const createGifWorkerSink = createFallbackAwareSink({
  startWorker: startGifWorker,
  createFallback: createMainThreadSink,
  onFallback: warnWorkerUnavailable,
  maxInFlight: MAX_IN_FLIGHT,
});
