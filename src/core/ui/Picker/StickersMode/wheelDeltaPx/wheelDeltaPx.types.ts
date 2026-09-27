export type WheelDeltaInput = {
  /**
   * Сдвиг колеса по оси (`deltaY`) в единицах `deltaMode`.
   */
  delta: number;

  /**
   * Единица сдвига: `0` — пиксели, `1` — строки, `2` — страницы (`WheelEvent.DOM_DELTA_*`).
   */
  deltaMode: number;

  /**
   * Высота видимой области прокручиваемого элемента, px — размер страницы.
   */
  pageHeight: number;
};
