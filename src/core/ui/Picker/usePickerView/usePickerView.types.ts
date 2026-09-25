export type View =
  | {
      /**
       * Вкладка без параметров: недавние, поиск GIF, добавление пака, настройки.
       */
      kind: 'recent' | 'gifs' | 'add' | 'settings';
    }
  | {
      /**
       * Вкладка пака стикеров.
       */
      kind: 'pack';

      /**
       * Открытый пак.
       */
      packId: string;
    };

export type PickerViewValue = {
  /**
   * Открытое представление пикера.
   */
  view: View;

  /**
   * Переключает представление и сбрасывает статус прошлого.
   */
  switchTo: (view: View) => void;
};
