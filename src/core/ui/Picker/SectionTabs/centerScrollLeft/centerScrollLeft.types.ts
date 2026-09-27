/**
 * Место вкладки в полосе.
 */
export type TabBox = {
  /**
   * Левый край вкладки от начала содержимого полосы, в пикселях (`offsetLeft`).
   */
  left: number;

  /**
   * Ширина вкладки в пикселях (`offsetWidth`).
   */
  width: number;
};

/**
 * Размеры полосы вкладок.
 */
export type StripBox = {
  /**
   * Видимая ширина полосы в пикселях.
   */
  width: number;

  /**
   * Полная ширина содержимого полосы в пикселях (`scrollWidth`).
   */
  scrollWidth: number;
};
