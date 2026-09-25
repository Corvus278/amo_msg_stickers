import type { SendItem } from '../db.types';

export type PickerCallbacks = {
  /**
   * Колбэк на выбор стикера или GIF: отправляет его в открытый чат. Отклонённый промис —
   * отправка не удалась, текст ошибки показывается в статусе пикера.
   */
  onSend: (item: SendItem) => Promise<void>;

  /**
   * Колбэк на закрытие пикера: вызывается один раз на каждое закрытие открытого
   * пикера — снаружи через `close()` и изнутри (Escape, успешная отправка).
   */
  onClose: () => void;
};

export type PickerHandle = {
  /**
   * Хост пикера с shadow root. Вставляется в DOM вызывающей стороной: `position: fixed`
   * панели считается от ближайшего предка с transform.
   */
  element: HTMLElement;

  /**
   * Открыт ли пикер сейчас.
   */
  readonly isOpen: boolean;

  /**
   * Открывает пикер; уже открытый не трогает.
   */
  open: () => void;

  /**
   * Закрывает пикер и вызывает `onClose`; закрытый не трогает.
   */
  close: () => void;

  /**
   * Переключает тему пикера вслед за темой страницы.
   */
  setTheme: (isDark: boolean) => void;
};
