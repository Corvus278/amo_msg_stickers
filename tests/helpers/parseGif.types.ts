export type ParsedFrame = {
  /**
   * Задержка кадра из Graphic Control Extension в мс (сотые × 10).
   */
  delayMs: number;

  /**
   * Метод disposal из Graphic Control Extension: 2 — «очистить до фона».
   */
  disposal: number;

  /**
   * Индекс прозрачного цвета; `null`, если флаг прозрачности в GCE снят.
   */
  transparentIndex: number | null;

  /**
   * Индексы пикселей кадра после распаковки LZW, построчно.
   */
  indices: Uint8Array;
};

export type ParsedGif = {
  /**
   * Ширина логического экрана.
   */
  width: number;

  /**
   * Высота логического экрана.
   */
  height: number;

  /**
   * Кадры по порядку.
   */
  frames: ParsedFrame[];
};
