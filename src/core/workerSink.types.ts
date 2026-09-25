import type { FrameSink } from './frameSink.types';
import type { GifEncoderOptions } from './gifEncoder.types';
import type { GifWorkerRequest, GifWorkerResponse } from './gifWorker.types';

/**
 * Часть `Worker`, которой пользуется клиент: настоящий Worker подходит без обёртки, в
 * тестах его заменяет фейк.
 */
export type WorkerPort = {
  /**
   * Отправка сообщения; буферы из `transfer` уходят без копии.
   */
  postMessage: (message: GifWorkerRequest, transfer: Transferable[]) => void;

  /**
   * Останавливает Worker; память кодировщика уходит вместе с ним.
   */
  terminate: () => void;

  /**
   * Ответы Worker-а.
   */
  onmessage: ((event: MessageEvent<GifWorkerResponse>) => void) | null;

  /**
   * Сбой Worker-а: скрипт не загрузился (CSP) или упал вне обработчика.
   */
  onerror: ((event: ErrorEvent) => void) | null;

  /**
   * Сообщение Worker-а не удалось разобрать.
   */
  onmessageerror: ((event: MessageEvent) => void) | null;
};

/**
 * Зависимости клиента Worker-а; окружение страницы подставляет `workerSink.ts`.
 */
export type WorkerSinkDeps = {
  /**
   * Размер кадра и признак анимации прохода.
   */
  options: GifEncoderOptions;

  /**
   * Запуск Worker-а; исключение — Worker в этом окружении недоступен.
   */
  startWorker: () => WorkerPort;

  /**
   * Приёмник на главном потоке — на случай, если Worker не заработал.
   */
  createFallback: (options: GifEncoderOptions) => FrameSink;

  /**
   * Worker не заработал, проход ушёл в фолбэк.
   */
  onFallback: (reason: unknown) => void;

  /**
   * Сколько кадров может быть отправлено Worker-у без `ack`.
   */
  maxInFlight: number;
};

/**
 * Зависимости фабрики приёмников: всё, кроме размера кадра, который у каждого прохода
 * свой.
 */
export type WorkerSinkFactoryDeps = Omit<WorkerSinkDeps, 'options'>;
