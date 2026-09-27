/**
 * Индекс вкладки, на которую уходит фокус.
 *
 * @param key — нажатая клавиша
 * @param index — вкладка в фокусе
 * @param count — число вкладок
 * @returns `null` — клавиша не навигационная
 */
const nextIndex = (key: string, index: number, count: number): number | null => {
  switch (key) {
    case 'ArrowRight': {
      return (index + 1) % count;
    }

    case 'ArrowLeft': {
      return (index - 1 + count) % count;
    }

    case 'Home': {
      return 0;
    }

    case 'End': {
      return count - 1;
    }

    default: {
      return null;
    }
  }
};

/**
 * Переводит фокус на соседнюю, первую или последнюю вкладку того же `tablist`.
 *
 * Активация ручная: стрелки, `Home` и `End` только переводят фокус, а открывает вкладку
 * Enter или пробел. Автоматическая не годится: вкладка GIF при открытии забирает фокус в
 * поле поиска, и проход стрелками через неё обрывался бы.
 *
 * @param key — нажатая клавиша
 * @param tab — вкладка в фокусе
 * @returns обработана ли клавиша: `false` — клавиша не навигационная
 */
export const moveTabFocus = (key: string, tab: HTMLElement): boolean => {
  const tablist = tab.closest('[role="tablist"]');

  if (!tablist) return false;

  const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
  const next = nextIndex(key, tabs.indexOf(tab), tabs.length);

  if (next === null) return false;

  tabs[next]?.focus();

  return true;
};
