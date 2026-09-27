const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Поведение программной прокрутки ленты и полосы вкладок: `'auto'` — мгновенно, если в системе
 * включено уменьшение движения, иначе `'smooth'`. У ленты и полосы нет CSS `scroll-behavior`,
 * поэтому `'auto'` прокручивает сразу.
 *
 * Настройка читается на каждый вызов, без подписки: меняется она редко, а следующий переход
 * прочитает её заново. Без `matchMedia` прокрутка плавная.
 *
 * @returns поведение для `scrollTo`
 */
export const scrollMotion = (): ScrollBehavior => {
  if (typeof matchMedia !== 'function') return 'smooth';

  return matchMedia(REDUCE_QUERY).matches ? 'auto' : 'smooth';
};
