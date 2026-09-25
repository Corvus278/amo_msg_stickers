import { isLottieJson } from './convert.types';
import { BYTES_IN_MB, readLimited } from './net';

/**
 * `.tgs` — gzip-сжатый Lottie JSON. У стикеров Telegram это сотни КБ JSON, а сжатый файл
 * в 50 КБ может развернуться в гигабайты: распаковку ограничиваем.
 */
const MAX_TGS_JSON_BYTES = 8 * BYTES_IN_MB;

const NOT_LOTTIE = 'Файл .tgs не похож на Lottie-анимацию';

/**
 * Распаковывает `.tgs` и проверяет, что внутри Lottie, пригодный для раскадровки. Больше
 * лимита, не gzip, не JSON или не Lottie — исключение; рендер при этом не запускается.
 *
 * @param blob — файл `.tgs`
 * @returns Lottie JSON
 */
export const readTgs = async (blob: Blob) => {
  const bytes = await readLimited(
    blob.stream().pipeThrough(new DecompressionStream('gzip')),
    MAX_TGS_JSON_BYTES
  );
  let json: unknown;

  try {
    json = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error(NOT_LOTTIE);
  }

  if (!isLottieJson(json)) throw new Error(NOT_LOTTIE);

  return json;
};
