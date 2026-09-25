import type { GifInfo } from './gif.types';

/**
 * Проверка GIF по содержимому, а не по Content-Type: проходим блочную структуру файла.
 * Так отсекаются HTML-страницы ошибок с кодом 200, обрезанные и битые файлы до того, как
 * они уйдут в чат.
 */

const GIF_SIGNATURES = ['GIF87a', 'GIF89a'];
const SIGNATURE_BYTES = 6;

/**
 * Сигнатура и Logical Screen Descriptor.
 */
const HEADER_BYTES = 13;
const SCREEN_PACKED_OFFSET = 10;

const EXTENSION_INTRODUCER = 0x21;
const IMAGE_SEPARATOR = 0x2c;
const TRAILER = 0x3b;

/**
 * Image Descriptor (без таблицы цветов) и байт минимального размера кода LZW за ним.
 */
const IMAGE_DESCRIPTOR_BYTES = 10;
const IMAGE_PACKED_OFFSET = 9;
const LZW_MIN_CODE_SIZE_BYTES = 1;

const COLOR_TABLE_FLAG = 0x80;
const COLOR_TABLE_SIZE_MASK = 0x07;
const RGB_BYTES = 3;

const readU16 = (bytes: Uint8Array, offset: number) => {
  return (bytes[offset] || 0) | ((bytes[offset + 1] || 0) << 8);
};

/**
 * Размер таблицы цветов, объявленной в packed-байте дескриптора; 0 — таблицы нет.
 *
 * @param packed — packed-байт дескриптора
 * @returns размер таблицы в байтах
 */
const colorTableBytes = (packed: number) => {
  if (!(packed & COLOR_TABLE_FLAG)) return 0;

  return RGB_BYTES * (1 << ((packed & COLOR_TABLE_SIZE_MASK) + 1));
};

/**
 * Пропускает цепочку sub-block-ов: байт длины, данные, …, нулевой терминатор.
 *
 * @param bytes — файл
 * @param from — позиция первого байта длины
 * @returns позиция после терминатора; -1 — цепочка оборвалась
 */
const skipSubBlocks = (bytes: Uint8Array, from: number) => {
  let pos = from;

  while (pos < bytes.length) {
    const size = bytes[pos] || 0;

    pos += 1 + size;

    if (!size) return pos;
  }

  return -1;
};

const hasGifSignature = (bytes: Uint8Array) => {
  return GIF_SIGNATURES.includes(
    String.fromCharCode(...bytes.subarray(0, SIGNATURE_BYTES))
  );
};

/**
 * Разбирает GIF. null — не GIF: нет сигнатуры, нулевые размеры или ни одного целого кадра.
 * Отсутствие trailer и мусор после последнего целого кадра допускаются — браузеры такие
 * файлы показывают.
 *
 * @param bytes — содержимое файла
 * @returns размеры и число кадров или null
 */
export const inspectGif = (bytes: Uint8Array): GifInfo | null => {
  if (bytes.length < HEADER_BYTES || !hasGifSignature(bytes)) return null;
  const width = readU16(bytes, SIGNATURE_BYTES);
  const height = readU16(bytes, SIGNATURE_BYTES + 2);

  if (!width || !height) return null;
  let pos = HEADER_BYTES + colorTableBytes(bytes[SCREEN_PACKED_OFFSET] || 0);
  let frames = 0;

  const toInfo = () => {
    return frames ? { width, height, frames } : null;
  };

  while (pos >= 0 && pos < bytes.length) {
    switch (bytes[pos]) {
      case EXTENSION_INTRODUCER: {
        /**
         * За интродьюсером — байт метки расширения, затем его sub-block-и.
         */
        pos = skipSubBlocks(bytes, pos + 2);
        break;
      }

      case IMAGE_SEPARATOR: {
        const packed = bytes[pos + IMAGE_PACKED_OFFSET] || 0;

        pos = skipSubBlocks(
          bytes,
          pos + IMAGE_DESCRIPTOR_BYTES + colorTableBytes(packed) + LZW_MIN_CODE_SIZE_BYTES
        );

        if (pos >= 0) frames++;
        break;
      }

      case TRAILER:

      default: {
        /**
         * Конец файла или неизвестный байт: дальше читать нечего, решают уже прочитанные
         * кадры.
         */
        return toInfo();
      }
    }
  }

  return toInfo();
};
