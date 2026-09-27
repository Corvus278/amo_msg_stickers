import type { MenuKeyEvent } from './menuKey.types';

/**
 * Открывает ли нажатие контекстное меню: `Shift+F10` или клавиша меню без других модификаторов.
 *
 * Своя проверка, а не только событие `contextmenu`: Chrome на macOS по `Shift+F10` его не шлёт,
 * а требование к клавиатуре одно на все системы.
 *
 * @param event — нажатие клавиши
 * @returns `true` — нажатие открывает меню
 */
export const isMenuKey = (event: MenuKeyEvent): boolean => {
  const { key, shiftKey, ctrlKey, altKey, metaKey } = event;

  if (ctrlKey || altKey || metaKey) return false;

  switch (key) {
    case 'F10': {
      return shiftKey;
    }

    case 'ContextMenu': {
      return !shiftKey;
    }

    default: {
      return false;
    }
  }
};
