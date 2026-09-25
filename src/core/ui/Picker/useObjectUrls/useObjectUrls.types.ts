export type ObjectUrls = {
  /**
   * Object URL блоба стикера: для одного id всегда один и тот же URL.
   */
  urlOf: (id: string, blob: Blob) => string;

  /**
   * Отзывает URL стикера; следующий `urlOf` с этим id создаст новый.
   */
  dropUrl: (id: string) => void;
};
