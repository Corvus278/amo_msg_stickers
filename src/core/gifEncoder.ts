import { applyPalette, GIFEncoder, quantize } from 'gifenc';

import type { GifEncoder, GifEncoderOptions, IndexedFrame } from './gifEncoder.types';

const ALPHA_THRESHOLD = 128;
const OPAQUE_ALPHA = 255;

/**
 * Байт на пиксель в RGBA-буфере.
 */
const CHANNELS = 4;

/**
 * Предел палитры GIF; при прозрачности один индекс резервируется под прозрачный цвет.
 */
const MAX_COLORS = 256;

/**
 * Упорядоченный дизеринг (Байер 4×4) убирает «кольца» на градиентах при 256 цветах.
 * В отличие от Флойда–Стейнберга узор привязан к координатам и не мерцает в анимации.
 */
const DITHER_STRENGTH = 12;

/**
 * Средняя ошибка цвета без дизеринга, выше которой он включается (плоские заливки
 * обходятся без него).
 */
const DITHER_MIN_ERROR = 1;
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => {
  return ((v + 0.5) / 16 - 0.5) * DITHER_STRENGTH;
});

/**
 * Ошибку цвета считаем по каждому 7-му пикселю: для решения о дизеринге выборки
 * хватает, а полный проход по кадру 512×512 заметно дороже.
 */
const ERROR_SAMPLE_STEP = 7;

/**
 * Disposal «очистить до фона» перед следующим кадром, иначе прозрачные анимации
 * «пачкаются»; -1 — поведение gifenc по умолчанию для статичной картинки.
 */
const DISPOSE_RESTORE_BACKGROUND = 2;
const DISPOSE_DEFAULT = -1;

/**
 * Средняя по каналам ошибка непрозрачных пикселей (по выборке каждого
 * `ERROR_SAMPLE_STEP`-го).
 */
const meanError = (rgba: Uint8ClampedArray, index: Uint8Array, palette: number[][]) => {
  let sum = 0;
  let count = 0;

  for (let p = 0; p < index.length; p += ERROR_SAMPLE_STEP) {
    const i = p * CHANNELS;

    if ((rgba[i + 3] || 0) < ALPHA_THRESHOLD) continue;
    const [r = 0, g = 0, b = 0] = palette[index[p] || 0] || [];

    sum +=
      Math.abs((rgba[i] || 0) - r) +
      Math.abs((rgba[i + 1] || 0) - g) +
      Math.abs((rgba[i + 2] || 0) - b);
    count++;
  }

  return count ? sum / count / 3 : 0;
};

/**
 * Палитра строится в rgb565 (65k корзин) только по непрозрачным пикселям,
 * прозрачность — отдельный зарезервированный индекс. rgba4444 из gifenc даёт
 * всего 16 уровней на канал: полосы на градиентах и сдвиг оттенков.
 */
const indexFrame = (rgba: Uint8ClampedArray, width: number): IndexedFrame => {
  const pixels = rgba.length / CHANNELS;
  const opaque = new Uint8Array(rgba.length);
  let opaqueBytes = 0;

  for (let p = 0; p < pixels; p++) {
    const i = p * CHANNELS;

    if ((rgba[i + 3] || 0) >= ALPHA_THRESHOLD) {
      opaque[opaqueBytes] = rgba[i] || 0;
      opaque[opaqueBytes + 1] = rgba[i + 1] || 0;
      opaque[opaqueBytes + 2] = rgba[i + 2] || 0;
      opaque[opaqueBytes + 3] = OPAQUE_ALPHA;
      opaqueBytes += CHANNELS;
    }
  }

  const hasTransparent = opaqueBytes < rgba.length;

  if (!opaqueBytes) {
    return {
      index: new Uint8Array(pixels),
      palette: [
        [0, 0, 0],
        [0, 0, 0],
      ],
      hasTransparent,
      transparentIndex: 0,
    };
  }

  const palette = quantize(
    opaque.subarray(0, opaqueBytes),
    hasTransparent ? MAX_COLORS - 1 : MAX_COLORS,
    { format: 'rgb565' }
  );

  let index = applyPalette(rgba, palette, 'rgb565');

  if (meanError(rgba, index, palette) > DITHER_MIN_ERROR) {
    const dithered = new Uint8ClampedArray(rgba.length);

    for (let p = 0; p < pixels; p++) {
      const i = p * CHANNELS;
      /**
       * Ячейка матрицы 4×4 — младшие два бита строки и столбца пикселя.
       */
      const d = BAYER_4[((Math.floor(p / width) & 3) << 2) | ((p % width) & 3)] || 0;

      dithered[i] = (rgba[i] || 0) + d;
      dithered[i + 1] = (rgba[i + 1] || 0) + d;
      dithered[i + 2] = (rgba[i + 2] || 0) + d;
      dithered[i + 3] = rgba[i + 3] || 0;
    }

    index = applyPalette(dithered, palette, 'rgb565');
  }

  let transparentIndex = 0;

  if (hasTransparent) {
    transparentIndex = palette.length;
    palette.push([0, 0, 0]);

    for (let p = 0; p < pixels; p++) {
      if ((rgba[p * CHANNELS + 3] || 0) < ALPHA_THRESHOLD) index[p] = transparentIndex;
    }
  }

  return { index, palette, hasTransparent, transparentIndex };
};

/**
 * Потоковый кодировщик GIF: кадр индексируется и сжимается сразу при записи, поэтому
 * в памяти не копятся несжатые кадры. Без DOM — одинаково работает на главном потоке,
 * в Worker-е и в `node`.
 *
 * @param options — размер кадров и признак анимации
 * @returns кодировщик
 */
export const createGifEncoder = ({
  width,
  height,
  isAnimated,
}: GifEncoderOptions): GifEncoder => {
  const gif = GIFEncoder();
  const dispose = isAnimated ? DISPOSE_RESTORE_BACKGROUND : DISPOSE_DEFAULT;

  return {
    write: (rgba, delayMs) => {
      const { index, palette, hasTransparent, transparentIndex } = indexFrame(
        rgba,
        width
      );

      gif.writeFrame(index, width, height, {
        palette,
        delay: delayMs,
        transparent: hasTransparent,
        transparentIndex,
        dispose,
      });
    },
    get byteLength() {
      return gif.bytesView().length;
    },
    finish: () => {
      gif.finish();

      return gif.bytes();
    },
  };
};
