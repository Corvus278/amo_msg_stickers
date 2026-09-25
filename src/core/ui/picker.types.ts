import type { SendItem } from '../db.types';

export type View =
  | {
      /**
       * Вкладка без параметров: недавние, поиск GIF, добавление набора, настройки.
       */
      kind: 'recent' | 'gifs' | 'add' | 'settings';
    }
  | {
      /**
       * Вкладка набора стикеров.
       */
      kind: 'pack';

      /**
       * Открытый набор.
       */
      packId: string;
    };

/**
 * Атрибуты элемента для `h()`: `on*` с функцией — слушатель события, `html` — innerHTML,
 * `true` — пустой атрибут, `false` и `undefined` — атрибут не ставится.
 */
export type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/**
 * Дочерний узел для `h()`: falsy-значения пропускаются — удобно для условной разметки.
 */
export type Child = Node | string | null | undefined | false;

export type Timer = ReturnType<typeof setTimeout>;

export type PickerCallbacks = {
  /**
   * Колбэк на выбор стикера или GIF: отправляет его в открытый чат. Отклонённый промис —
   * отправка не удалась, текст ошибки показывается в статусе пикера.
   */
  onSend: (item: SendItem) => Promise<void>;

  /**
   * Колбэк на закрытие пикера.
   */
  onClose: () => void;
};
