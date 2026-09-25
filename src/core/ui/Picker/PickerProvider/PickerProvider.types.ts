import type { ComponentChildren } from 'preact';

import type { Pack, SendItem } from '../../../db.types';
import type { Host, Settings } from '../../../host.types';
import type { PickerViewValue, View } from '../usePickerView/usePickerView.types';

export type PickerStatus = {
  /**
   * Текст строки статуса.
   */
  text: string;

  /**
   * Статус — ошибка: показывается цветом ошибки.
   */
  isError: boolean;
};

export type PickerContextValue = {
  /**
   * Окружение: сеть и настройки расширения или userscript.
   */
  env: Host;

  /**
   * Настройки на момент последней загрузки.
   */
  settings: Settings;

  /**
   * Перечитывает настройки из окружения — после сохранения или при открытии.
   */
  refreshSettings: () => Promise<void>;

  /**
   * Паки стикеров в порядке вкладок.
   */
  packs: Pack[];

  /**
   * Перечитывает паки из базы — после импорта, создания или удаления.
   */
  refreshPacks: () => Promise<void>;

  /**
   * Текущий статус; `null` — строка статуса скрыта.
   */
  status: PickerStatus | null;

  /**
   * Показывает информационный статус.
   */
  showStatus: (text: string) => void;

  /**
   * Показывает статус ошибки.
   */
  showError: (text: string) => void;

  /**
   * Скрывает строку статуса.
   */
  clearStatus: () => void;

  /**
   * Отправляет стикер или GIF: статус «Отправляю…», при успехе — закрытие пикера, при
   * ошибке — её текст в статусе. Промис не отклоняется и завершается вместе с отправкой.
   */
  send: (item: SendItem) => Promise<void>;

  /**
   * Object URL блоба стикера: для одного id один и тот же URL, пока пикер открыт. При
   * закрытии URL отзываются, после открытия `urlOf` создаёт новые.
   */
  urlOf: (id: string, blob: Blob) => string;

  /**
   * Отзывает URL удалённого стикера.
   */
  dropUrl: (id: string) => void;

  /**
   * Импорт пака из Telegram: его ход переживает уход с вкладки «Добавить стикеры».
   */
  packImport: PackImportState;
};

export type PackImportState = {
  /**
   * Идёт импорт: повторный запуск недоступен, в том числе после возврата на вкладку.
   */
  isImporting: boolean;

  /**
   * Доля обработанных стикеров в процентах; `null` — импорт не идёт, полоса прогресса
   * скрыта: после успеха и после ошибки её нет.
   */
  percent: number | null;

  /**
   * Импортирует пак по ссылке или имени; пока идёт импорт, вызов ничего не делает.
   * Промис не отклоняется: ошибка уходит в статус, по успеху открывается вкладка пака.
   */
  importPack: (link: string) => Promise<void>;
};

export type PackImportOptions = {
  /**
   * Окружение: сеть для Bot API и загрузки файлов.
   */
  env: Host;

  /**
   * Настройки с токеном Telegram-бота.
   */
  settings: Settings;

  /**
   * Перечитывает паки: вкладка пака появляется после первого стикера и по завершении.
   */
  refreshPacks: () => Promise<void>;

  /**
   * Показывает ход импорта и итог в статусе.
   */
  showStatus: (text: string) => void;

  /**
   * Показывает ошибку импорта в статусе.
   */
  showError: (text: string) => void;

  /**
   * Открывает вкладку импортированного пака.
   */
  switchTo: (view: View) => void;
};

export type PickerProviderProps = {
  /**
   * Окружение: сеть и настройки расширения или userscript.
   */
  env: Host;

  /**
   * Колбэк на выбор стикера или GIF. Отклонённый промис — отправка не удалась.
   */
  onSend: (item: SendItem) => Promise<void>;

  /**
   * Колбэк на закрытие пикера после успешной отправки.
   */
  onClose: () => void;

  /**
   * Открыт ли пикер: при закрытии отзываются object URL стикеров.
   */
  isOpen: boolean;

  /**
   * Дерево пикера.
   */
  children: ComponentChildren;
};

export type PickerStateOptions = {
  /**
   * Окружение: сеть и настройки расширения или userscript.
   */
  env: Host;

  /**
   * Колбэк на выбор стикера или GIF. Отклонённый промис — отправка не удалась.
   */
  onSend: (item: SendItem) => Promise<void>;

  /**
   * Колбэк на закрытие пикера после успешной отправки.
   */
  onClose: () => void;

  /**
   * Открыт ли пикер: при закрытии отзываются object URL стикеров.
   */
  isOpen: boolean;
};

export type PickerStateValue = {
  /**
   * Значение `PickerContext`.
   */
  picker: PickerContextValue;

  /**
   * Значение `PickerViewContext`.
   */
  view: PickerViewValue;
};
