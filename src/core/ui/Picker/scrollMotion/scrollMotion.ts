const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Включено ли в системе уменьшение движения. Настройка читается на каждый вызов, без подписки:
 * меняется она редко, а следующая анимация или прокрутка прочитает её заново. Без `matchMedia`
 * движение не уменьшено.
 *
 * @returns `true` — анимации и плавные прокрутки выключаются
 */
export const isMotionReduced = (): boolean => {
  if (typeof matchMedia !== 'function') return false;

  return matchMedia(REDUCE_QUERY).matches;
};

/**
 * Поведение программной прокрутки ленты и полосы вкладок: `'auto'` — мгновенно, если в системе
 * включено уменьшение движения, иначе `'smooth'`. У ленты и полосы нет CSS `scroll-behavior`,
 * поэтому `'auto'` прокручивает сразу.
 *
 * @returns поведение для `scrollTo`
 */
export const scrollMotion = (): ScrollBehavior => {
  return isMotionReduced() ? 'auto' : 'smooth';
};
