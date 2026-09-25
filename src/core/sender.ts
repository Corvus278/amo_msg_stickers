import { isDraftEmpty, isEditing } from './amoDom';
import type { Composer } from './amoDom.types';
import { inspectGif } from './gif';

export class SendError extends Error {}

const POLL_INTERVAL_MS = 80;
const ATTACH_TIMEOUT_MS = 15_000;

/**
 * Пауза после появления вложения: React должен дорисовать его, иначе onMainSend может
 * не увидеть файл.
 */
const RENDER_SETTLE_MS = 60;

const wait = (ms: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
};

const waitFor = async (check: () => boolean, timeoutMs: number) => {
  const start = Date.now();

  while (!check()) {
    if (Date.now() - start > timeoutMs) return false;
    await wait(POLL_INTERVAL_MS);
  }

  return true;
};

/**
 * Отправка через штатный путь amo: paste файла в поле ввода → вложение → клик «Отправить».
 *
 * В DataTransfer кладём ТОЛЬКО файл: при наличии text/plain поле вставит текст, а не вложение.
 */
export const sendFile = async (composer: Composer, file: File) => {
  if (isEditing(composer))
    throw new SendError('Сначала завершите редактирование сообщения');
  if (!isDraftEmpty(composer))
    throw new SendError(
      'В поле ввода есть текст или вложения — стикер ушёл бы вместе с ними'
    );

  const { editable, sendButton } = composer;
  const dataTransfer = new DataTransfer();

  dataTransfer.items.add(file);

  editable.focus();
  editable.dispatchEvent(
    new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    })
  );

  const isAttached = await waitFor(() => {
    return !isDraftEmpty(composer);
  }, ATTACH_TIMEOUT_MS);

  if (!isAttached)
    throw new SendError('amo не принял файл (лимит размера или хранилища?)');

  await wait(RENDER_SETTLE_MS);
  sendButton?.click();
};

export const toGifFile = (blob: Blob, name = 'sticker') => {
  return new File([blob], `${name}.gif`, { type: 'image/gif' });
};

/**
 * То же, что `toGifFile`, но для файла из сети: байты проверяются как GIF, иначе
 * `SendError` — в поле ввода не попадёт HTML-страница ошибки или обрезанный файл.
 *
 * @param blob — скачанный файл
 * @param name — имя файла без расширения
 * @returns файл для вставки в поле ввода
 */
export const toCheckedGifFile = async (blob: Blob, name?: string) => {
  if (!inspectGif(new Uint8Array(await blob.arrayBuffer()))) {
    throw new SendError('Файл не похож на GIF');
  }

  return toGifFile(blob, name);
};
