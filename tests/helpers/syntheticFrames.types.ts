export type SyntheticFrame = {
  /**
   * RGBA-пиксели кадра `SYNTHETIC_WIDTH × SYNTHETIC_HEIGHT`.
   */
  rgba: Uint8ClampedArray;

  /**
   * Задержка кадра в мс.
   */
  delayMs: number;
};
