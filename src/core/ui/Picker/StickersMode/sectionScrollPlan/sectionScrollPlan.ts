import type {
  SectionScrollPlan,
  SectionScrollPlanOptions,
} from './sectionScrollPlan.types';

/**
 * План прокрутки ленты к разделу: мгновенный прыжок и плавный доезд.
 *
 * К разделу дальше одной видимой области лента сначала мгновенно встаёт на одну видимую область
 * от цели — с той стороны, откуда идёт, — и доезжает плавно только этот последний экран. Плавный
 * проезд через все промежуточные паки провёл бы окно виртуализации через каждый их ряд, и все их
 * GIF начали бы декодироваться.
 *
 * Цель зажата в `[0, maxScroll]`: к недостижимой точке прокрутка всё равно встала бы в край, и
 * прыжок от неё промахнулся бы мимо последнего экрана.
 *
 * @param options — текущая прокрутка, прокрутка раздела и размеры ленты
 * @returns прокрутка прыжка (`null` — без прыжка) и цель доезда
 */
export const sectionScrollPlan = (
  options: SectionScrollPlanOptions
): SectionScrollPlan => {
  const { from, to, viewport, maxScroll } = options;
  const target = Math.min(Math.max(to, 0), Math.max(maxScroll, 0));

  if (Math.abs(target - from) <= viewport) return { jumpTo: null, target };

  const jumpTo = target > from ? target - viewport : target + viewport;

  return { jumpTo, target };
};
