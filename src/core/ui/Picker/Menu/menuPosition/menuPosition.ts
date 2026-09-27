import type { Box, MenuPoint, MenuSize } from './menuPosition.types';

/**
 * Зазор между меню и краем панели: меню у края не сливается с её рамкой.
 */
const MARGIN = 4;

/**
 * Место меню в пределах панели. Меню встаёт под источником от его левого края — под точкой
 * клика или под кнопкой; без места снизу — над источником, без места и сверху — прижато к
 * низу панели. По горизонтали меню сдвигается внутрь панели, а выше панели не поднимается.
 *
 * @param anchor — источник меню: точка клика или прямоугольник кнопки
 * @param size — размер меню
 * @param bounds — прямоугольник панели
 * @returns левый верхний угол меню в координатах окна
 */
export const menuPosition = (anchor: Box, size: MenuSize, bounds: Box): MenuPoint => {
  const { width, height } = size;
  const minLeft = bounds.left + MARGIN;
  const minTop = bounds.top + MARGIN;
  const maxBottom = bounds.bottom - MARGIN;
  const left = Math.max(minLeft, Math.min(anchor.left, bounds.right - MARGIN - width));

  if (anchor.bottom + height <= maxBottom) return { left, top: anchor.bottom };

  const above = anchor.top - height;

  if (above >= minTop) return { left, top: above };

  return { left, top: Math.max(minTop, maxBottom - height) };
};
