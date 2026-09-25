import type { ParsedFrame, ParsedGif } from './parseGif.types';

const EXTENSION = 0x21;
const IMAGE = 0x2c;
const TRAILER = 0x3b;
const GRAPHIC_CONTROL = 0xf9;
const COLOR_TABLE_FLAG = 0x80;
const TRANSPARENT_FLAG = 0x01;
const MAX_CODE_SIZE = 12;
const CENTISECOND_MS = 10;

/**
 * Длина таблицы цветов в байтах по младшим трём битам упакованного поля.
 *
 * @param packed — упакованное поле дескриптора
 * @returns байт таблицы, 0 — таблицы нет
 */
const colorTableBytes = (packed: number) => {
  return packed & COLOR_TABLE_FLAG ? 3 * (1 << ((packed & 7) + 1)) : 0;
};

/**
 * Распаковка LZW кадра GIF: коды переменной длины, младшими битами вперёд.
 *
 * @param minCodeSize — минимальный размер кода из потока
 * @param data — склеенные подблоки данных кадра
 * @param pixels — число пикселей кадра
 * @returns индексы пикселей
 */
const decodeLzw = (minCodeSize: number, data: Uint8Array, pixels: number) => {
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  const out = new Uint8Array(pixels);
  let written = 0;
  let bit = 0;
  let codeSize = minCodeSize + 1;
  let table: number[][] = [];
  let prev: number[] | null = null;

  const reset = () => {
    table = Array.from({ length: clear + 2 }, (_, code) => {
      return [code];
    });
    codeSize = minCodeSize + 1;
    prev = null;
  };

  const read = () => {
    let code = 0;

    for (let i = 0; i < codeSize; i++, bit++) {
      code |= (((data[bit >> 3] || 0) >> (bit & 7)) & 1) << i;
    }

    return code;
  };

  reset();

  while (bit + codeSize <= data.length * 8 && written < pixels) {
    const code = read();

    if (code === clear) {
      reset();
      continue;
    }

    if (code === end) break;

    const known = table[code];
    const entry: number[] = known || [...(prev || []), (prev || [])[0] || 0];

    if (prev) table.push([...prev, entry[0] || 0]);

    for (const index of entry) {
      if (written < pixels) out[written++] = index;
    }

    prev = entry;

    if (table.length === 1 << codeSize && codeSize < MAX_CODE_SIZE) codeSize++;
  }

  return out;
};

/**
 * Разбор GIF для проверки кодировщика: в отличие от `inspectGif` читает задержку, disposal и
 * прозрачность из Graphic Control Extension и распаковывает индексы пикселей каждого кадра.
 *
 * @param bytes — байты GIF
 * @returns размеры экрана и кадры
 */
export const parseGif = (bytes: Uint8Array): ParsedGif => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  const frames: ParsedFrame[] = [];
  let pos = 13 + colorTableBytes(bytes[10] || 0);
  let control: Omit<ParsedFrame, 'indices'> = {
    delayMs: 0,
    disposal: 0,
    transparentIndex: null,
  };

  const readSubBlocks = () => {
    const parts: number[] = [];

    for (let size = bytes[pos++] || 0; size; size = bytes[pos++] || 0) {
      parts.push(...bytes.subarray(pos, pos + size));
      pos += size;
    }

    return new Uint8Array(parts);
  };

  while (pos < bytes.length) {
    const block = bytes[pos++];

    if (block === TRAILER) break;

    if (block === EXTENSION) {
      const label = bytes[pos++];
      const body = readSubBlocks();

      if (label === GRAPHIC_CONTROL) {
        const packed = body[0] || 0;

        control = {
          delayMs: ((body[1] || 0) | ((body[2] || 0) << 8)) * CENTISECOND_MS,
          disposal: (packed >> 2) & 7,
          transparentIndex: packed & TRANSPARENT_FLAG ? body[3] || 0 : null,
        };
      }

      continue;
    }

    if (block !== IMAGE) throw new Error(`Неизвестный блок GIF ${block} на ${pos - 1}`);

    const frameWidth = view.getUint16(pos + 4, true);
    const frameHeight = view.getUint16(pos + 6, true);

    pos += 9 + colorTableBytes(bytes[pos + 8] || 0);
    const minCodeSize = bytes[pos++] || 0;
    const data = readSubBlocks();

    frames.push({
      ...control,
      indices: decodeLzw(minCodeSize, data, frameWidth * frameHeight),
    });
  }

  return { width, height, frames };
};
