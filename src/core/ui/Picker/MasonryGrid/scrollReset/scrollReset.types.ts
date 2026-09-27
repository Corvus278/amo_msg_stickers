/**
 * Срез прокручиваемого элемента ленты: тест подставляет объект без браузера.
 */
export type ResetBox = Pick<Element, 'scrollTop' | 'clientWidth'>;

export type ScrollReset = {
  /**
   * Выдача сброшена: ленту нужно прокрутить к началу.
   */
  request: () => void;

  /**
   * Прокручивает ленту к началу, если сброс запрошен и лента видна.
   *
   * @returns сброшена ли прокрутка
   */
  apply: (box: ResetBox) => boolean;
};
