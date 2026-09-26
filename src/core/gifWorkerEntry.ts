import { createGifWorkerHandler } from './gifWorker';
import type { GifWorkerRequest } from './gifWorker.types';

/**
 * Точка входа Worker-а кодирования GIF: `build.mjs` собирает её отдельным бандлом и
 * отдаёт ядру строкой (`gif-worker:code`). Форма `postMessage(message, { transfer })`
 * одинакова у `Window` и у глобального объекта Worker-а, поэтому код проверяется
 * типами проекта без отдельной конфигурации под Worker.
 */
const handle = createGifWorkerHandler((message, transfer = []) => {
  globalThis.postMessage(message, { transfer });
});

globalThis.addEventListener('message', (event: MessageEvent<GifWorkerRequest>) => {
  handle(event.data);
});
