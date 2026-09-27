/**
 * Срез элемента индикатора, который нужен постановке: без DOM, чтобы её проверял тест.
 */
export type IndicatorElement = {
  /**
   * Inline-стили индикатора: место, ширина, видимость и выключение перехода.
   */
  style: Pick<CSSStyleDeclaration, 'transform' | 'width' | 'visibility' | 'transition'>;

  /**
   * Чтение заставляет браузер применить стили сразу.
   */
  readonly offsetWidth: number;
};

/**
 * Место выбранной вкладки в прокручиваемом содержимом полосы.
 */
export type IndicatorTarget = {
  /**
   * `offsetLeft` вкладки от полосы.
   */
  left: number;

  /**
   * `offsetWidth` вкладки.
   */
  width: number;
};
