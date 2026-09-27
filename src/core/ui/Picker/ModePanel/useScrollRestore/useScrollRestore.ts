import { useLayoutEffect, useState } from 'preact/hooks';

import { createScrollMemory } from '../scrollMemory';
import type { ScrollBox } from '../scrollMemory.types';

/**
 * Прокрутка скрываемой панели: скрытие `display: none` сбрасывает её, а показ возвращает
 * запомненную — в layout-эффекте, до отрисовки, без прыжка к началу.
 *
 * @param isActive — видна ли панель
 * @returns запоминание прокрутки элемента панели
 */
export const useScrollRestore = (isActive: boolean) => {
  const [scrollMemory] = useState(createScrollMemory);

  useLayoutEffect(() => {
    if (isActive) scrollMemory.restore();
  }, [isActive, scrollMemory]);

  return (box: ScrollBox) => {
    scrollMemory.remember(box);
  };
};
