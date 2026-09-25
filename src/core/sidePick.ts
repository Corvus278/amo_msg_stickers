/**
 * Потолок веса готового GIF — один на весь код: и для выбора стороны по пробе, и для
 * лестницы повторных проходов, и для GIF без перекодирования.
 */
export const MAX_GIF_BYTES = 2 * 1024 * 1024;

/**
 * Сколько кадров плана кодируется в пробном проходе.
 */
export const SAMPLE_FRAMES = 8;

/**
 * Запас оценки: проба не видит заголовков GIF и разброса веса между кадрами.
 */
export const SAFETY = 1.1;

/**
 * Меньшие стороны, до которых уменьшается стикер, если GIF не влезает в `MAX_GIF_BYTES`.
 */
const FALLBACK_SIDES = [384, 320, 256];

/**
 * Ряд сторон для выбора: сторона источника, затем меньшие неё из `FALLBACK_SIDES`.
 * Мелкий источник не увеличивается.
 *
 * @param side — большая сторона источника, уже вписанная в 512 px
 * @returns стороны по убыванию
 */
export const sideLadder = (side: number) => {
  return [
    side,
    ...FALLBACK_SIDES.filter((fallback) => {
      return fallback < side;
    }),
  ];
};

/**
 * Наибольшая сторона ряда, при которой оценка веса GIF укладывается в `MAX_GIF_BYTES`,
 * иначе последняя сторона ряда. Вес LZW-потока растёт примерно с числом пикселей,
 * поэтому оценка масштабируется по площади — квадрату отношения сторон. Оценка
 * округляется до целых байт вверх, и ровно `MAX_GIF_BYTES` ещё укладывается.
 *
 * @param sampleBytes — вес пробных кадров в стороне источника
 * @param sampleCount — сколько кадров в пробе; 0 — пробы не было, берётся сторона источника
 * @param frameCount — число кадров плана
 * @param side — большая сторона источника, уже вписанная в 512 px
 * @returns выбранная большая сторона
 */
export const pickSide = (
  sampleBytes: number,
  sampleCount: number,
  frameCount: number,
  side: number
) => {
  if (!sampleCount) return side;

  const ladder = sideLadder(side);
  const frameBytes = (sampleBytes / sampleCount) * frameCount;
  const fitting = ladder.find((candidate) => {
    return Math.ceil(frameBytes * (candidate / side) ** 2 * SAFETY) <= MAX_GIF_BYTES;
  });

  return fitting || ladder.at(-1) || side;
};

/**
 * Номера пробных кадров, равномерно по плану, с первым и последним кадром. План не
 * длиннее `SAMPLE_FRAMES` отдаётся целиком.
 *
 * @param frameCount — число кадров плана
 * @returns возрастающие номера кадров без повторов
 */
export const sampleIndices = (frameCount: number) => {
  const count = Math.min(frameCount, SAMPLE_FRAMES);

  /**
   * Шаг по плану не меньше 1, когда план длиннее пробы, поэтому округлённые номера
   * не повторяются.
   */
  const step = count > 1 ? (frameCount - 1) / (count - 1) : 0;

  return Array.from({ length: count }, (_, i) => {
    return Math.round(i * step);
  });
};
