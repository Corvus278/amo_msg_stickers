export type ObjectUrls = {
  /**
   * Object URL блоба стикера: для одного id один и тот же URL, пока пикер открыт. При
   * закрытии URL отзываются, после открытия `urlOf` создаёт новые.
   */
  urlOf: (id: string, blob: Blob) => string;

  /**
   * Отзывает URL стикера; следующий `urlOf` с этим id создаст новый.
   */
  dropUrl: (id: string) => void;
};
