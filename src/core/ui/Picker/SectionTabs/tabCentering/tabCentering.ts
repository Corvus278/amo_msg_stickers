import type { TabCentering, TabCenteringOptions } from './tabCentering.types';

/**
 * Решает, когда и с каким движением ставить выбранную вкладку по центру полосы, без DOM.
 *
 * Плавно полоса доезжает, только если на прошлом замере вкладка уже стояла на месте на видимой
 * полосе. Первая постановка, постановка после неудачи и показ полосы после скрытия — мгновенно:
 * иначе при открытии попапа и возврате в режим полоса проезжала бы от начала к вкладке.
 *
 * Скрытие (`display: none`) сбрасывает прокрутку полосы, поэтому показ ставит вкладку заново,
 * даже если она не менялась.
 *
 * @param options — постановка вкладки и движение, разрешённое системой
 * @returns контроллер центрирования
 */
export const createTabCentering = (options: TabCenteringOptions): TabCentering => {
  const { place, motion } = options;
  let isPlaced = false;

  return {
    select: () => {
      isPlaced = place(isPlaced ? motion() : 'auto');
    },
    resize: (width) => {
      if (!width) {
        isPlaced = false;

        return;
      }

      if (!isPlaced) isPlaced = place('auto');
    },
  };
};
