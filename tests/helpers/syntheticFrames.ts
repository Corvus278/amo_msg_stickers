import type { SyntheticFrame } from './syntheticFrames.types';

export const SYNTHETIC_WIDTH = 40;
export const SYNTHETIC_HEIGHT = 30;

/**
 * Угол прозрачных пикселей в кадрах с прозрачностью.
 */
export const TRANSPARENT_CORNER = 8;

const CHANNELS = 4;
const OPAQUE = 255;

/**
 * Альфа ниже порога 1-битной прозрачности кодировщика: пиксель должен стать прозрачным.
 */
const SEMI_ALPHA = 100;

/**
 * Кадр-градиент: сотни цветов включают дизеринг, угол `TRANSPARENT_CORNER` — прозрачность.
 *
 * @param shift — сдвиг градиента, чтобы кадры различались
 * @param hasCorner — оставить ли прозрачный угол
 * @returns RGBA-буфер кадра
 */
const gradient = (shift: number, hasCorner: boolean) => {
  const rgba = new Uint8ClampedArray(SYNTHETIC_WIDTH * SYNTHETIC_HEIGHT * CHANNELS);

  for (let y = 0; y < SYNTHETIC_HEIGHT; y++) {
    for (let x = 0; x < SYNTHETIC_WIDTH; x++) {
      const i = (y * SYNTHETIC_WIDTH + x) * CHANNELS;
      const isCorner = hasCorner && x < TRANSPARENT_CORNER && y < TRANSPARENT_CORNER;

      rgba[i] = (x * 6 + shift) & OPAQUE;
      rgba[i + 1] = (y * 8 + shift * 2) & OPAQUE;
      rgba[i + 2] = (x * y + shift * 3) & OPAQUE;
      rgba[i + 3] = isCorner ? 0 : OPAQUE;
    }
  }

  return rgba;
};

/**
 * Плоская заливка с полупрозрачными полосами: без дизеринга, прозрачность по порогу альфы.
 *
 * @returns RGBA-буфер кадра
 */
const flatStriped = () => {
  const rgba = new Uint8ClampedArray(SYNTHETIC_WIDTH * SYNTHETIC_HEIGHT * CHANNELS);

  for (let p = 0; p < SYNTHETIC_WIDTH * SYNTHETIC_HEIGHT; p++) {
    const i = p * CHANNELS;

    rgba[i] = 200;
    rgba[i + 1] = 40;
    rgba[i + 2] = 90;
    rgba[i + 3] = Math.floor(p / SYNTHETIC_WIDTH) % 3 ? OPAQUE : SEMI_ALPHA;
  }

  return rgba;
};

/**
 * Детерминированный набор кадров, покрывающий все ветки индексации: градиент с дизерингом
 * и прозрачным углом, непрозрачный градиент, плоская заливка и полностью прозрачный кадр.
 *
 * @returns кадры по порядку
 */
export const syntheticFrames = (): SyntheticFrame[] => {
  return [
    { rgba: gradient(0, true), delayMs: 40 },
    { rgba: gradient(37, false), delayMs: 100 },
    { rgba: flatStriped(), delayMs: 60 },
    {
      rgba: new Uint8ClampedArray(SYNTHETIC_WIDTH * SYNTHETIC_HEIGHT * CHANNELS),
      delayMs: 40,
    },
  ];
};
