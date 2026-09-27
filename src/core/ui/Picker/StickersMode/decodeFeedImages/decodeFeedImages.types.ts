/**
 * Картинка ленты — в той мере, в какой её касается ожидание декодирования.
 */
export type FeedImage = Pick<HTMLImageElement, 'decode'> & {
  /**
   * Положение картинки во вьюпорте: нужны только её верх и низ.
   */
  getBoundingClientRect: () => Pick<DOMRect, 'top' | 'bottom'>;
};

/**
 * Прокручиваемый элемент ленты — в той мере, в какой его касается ожидание декодирования.
 */
export type FeedImagesElement = Pick<HTMLElement, 'scrollTop'> & {
  /**
   * Положение ленты во вьюпорте: нужен только её верх.
   */
  getBoundingClientRect: () => Pick<DOMRect, 'top'>;

  /**
   * Картинки ленты.
   */
  querySelectorAll: (selectors: 'img') => Iterable<FeedImage>;
};

export type DecodeFeedImagesOptions = {
  /**
   * Прокручиваемый элемент ленты.
   */
  element: FeedImagesElement;

  /**
   * Верх полосы ленты, картинки которой ждём, — в координатах прокрутки, в пикселях.
   */
  top: number;

  /**
   * Низ полосы ленты, в координатах прокрутки, в пикселях.
   */
  bottom: number;

  /**
   * Потолок ожидания, мс: дольше лента не ждёт и едет с тем, что успело декодироваться.
   */
  ceilingMs: number;
};
