import type { WheelDeltaInput } from './wheelDeltaPx.types';

/**
 * Высота строки для колеса в строках, px: у ленты стикеров нет своей строки текста, а 40 px —
 * шаг, которым Chrome прокручивает страницу на строку колеса.
 */
export const LINE_HEIGHT_PX = 40;

/**
 * `WheelEvent.DOM_DELTA_LINE`: в окружении тестов `WheelEvent` нет.
 */
const DELTA_LINE = 1;

/**
 * `WheelEvent.DOM_DELTA_PAGE`.
 */
const DELTA_PAGE = 2;

/**
 * Сдвиг колеса в пикселях. Колесо в строках и страницах шлют не все устройства и браузеры, а
 * `scrollTo` принимает только пиксели. Неизвестная единица считается пикселями.
 *
 * @param input — сдвиг, его единица и высота видимой области
 * @returns сдвиг в пикселях с тем же знаком
 */
export const wheelDeltaPx = ({
  delta,
  deltaMode,
  pageHeight,
}: WheelDeltaInput): number => {
  switch (deltaMode) {
    case DELTA_LINE: {
      return delta * LINE_HEIGHT_PX;
    }

    case DELTA_PAGE: {
      return delta * pageHeight;
    }

    default: {
      return delta;
    }
  }
};
