import type { ScrollReset } from './scrollReset.types';

/**
 * Прокрутка ленты к началу при сбросе выдачи. Заглушки первой загрузки и раздел недавних
 * оставляют ленту высокой, и без сброса новая выдача открылась бы с середины.
 *
 * Скрытой ленте (`display: none`, ширина 0) прокрутку не поставить, поэтому сброс ждёт показа:
 * при показе панель режима возвращает запомненную прокрутку, а сброс перекрывает её.
 *
 * @returns сброс прокрутки одной ленты
 */
export const createScrollReset = (): ScrollReset => {
  let isPending = false;

  return {
    request: () => {
      isPending = true;
    },
    apply: (box) => {
      if (!isPending || !box.clientWidth) return false;

      isPending = false;
      box.scrollTop = 0;

      return true;
    },
  };
};
