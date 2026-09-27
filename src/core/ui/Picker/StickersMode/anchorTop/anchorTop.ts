import type { AnchorTopOptions } from './anchorTop.types';

/**
 * Прокрутка, которую ставит запрос `scrollToSection`, — верх заголовка раздела.
 *
 * `null` — прокручивать сейчас нечего: запрос уже исполнен, раскладки нет, раздела в ней ещё нет
 * или раскладка построена по прежнему чтению библиотеки. В последнем случае запрос ждёт
 * перечитывания: импорт показывает пак после первого стикера, и по такой раскладке заголовок
 * нового пака стоит выше, чем после импорта целиком.
 *
 * @param options — запрос, номер исполненного запроса и раскладка
 * @returns прокрутка ленты или `null`
 */
export const anchorTop = <T>(options: AnchorTopOptions<T>): number | null => {
  const { anchor, appliedSeq, layout, isCurrent } = options;

  if (!anchor || !layout || !isCurrent || anchor.seq === appliedSeq) return null;

  const target = layout.sectionTops.find(({ sectionId }) => {
    return sectionId === anchor.sectionId;
  });

  return target ? target.top : null;
};
