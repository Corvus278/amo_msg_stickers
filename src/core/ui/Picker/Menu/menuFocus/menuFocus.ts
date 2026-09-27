/**
 * Пункт меню, на который уходит фокус по клавише.
 *
 * @param key — нажатая клавиша
 * @param index — пункт в фокусе; `-1` — фокус на самом меню, а не на пункте
 * @param count — число пунктов
 * @returns `null` — клавиша не навигационная или пунктов нет
 */
export const nextMenuIndex = (
  key: string,
  index: number,
  count: number
): number | null => {
  if (!count) return null;

  switch (key) {
    case 'ArrowDown': {
      return (index + 1) % count;
    }

    case 'ArrowUp': {
      return index < 0 ? count - 1 : (index - 1 + count) % count;
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
