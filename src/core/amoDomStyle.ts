/**
 * Стиль своих сообщений в ленте amo — одни правила для любой разметки: что меняется у нашего
 * сообщения, задаёт этот модуль, а где оно в DOM — селекторы разметки (`MessageSelectors`).
 */

import { tailwindConfig } from '../../tailwind.config';

import type {
  MessageSelectors,
  QuoteLayout,
  QuoteRoom,
  StickerSizing,
} from './amoDom.types';

/**
 * Лимит стороны стикера в ленте — как у стикеров Telegram.
 */
const STICKER_MAX_SIDE_PX = 208;

/**
 * Ряд сообщения-ответа нашей картинкой — контейнер `REPLY_CONTAINER`: ширина плашки и переход
 * в узкий режим считаются от ширины ряда (`cqw`, container query).
 */
const REPLY_CONTAINER = 'amostk-reply';

const { borderRadius } = tailwindConfig.theme.extend;
const { boxShadow, colors } = tailwindConfig.theme;

/**
 * Фон плашки — фон пузыря amo того же направления и темы: цвета текста цитаты amo подобраны под
 * него. Значения — из токенов классов пузыря: входящий — `from-gray-110 to-white-0`,
 * `dark:bg-black-60`; исходящий — `from-flowerBlue-20 to-blue-120`, `dark:bg-beige-80`.
 */
const BUBBLE_BACKGROUND = {
  incoming: `linear-gradient(to top, ${colors.gray[110]}, ${colors.white[0]})`,
  incomingDark: colors.black[60],
  outgoing: `linear-gradient(to top, ${colors.flowerBlue[20]}, ${colors.blue[120]})`,
  outgoingDark: colors.beige[80],
};

/**
 * Скругление и тень пузыря amo — `rounded-lgx` и `shadow-md`.
 */
const BUBBLE_RADIUS = borderRadius.lgx;
const BUBBLE_SHADOW = boxShadow.md;

/**
 * Плашка занимает свободное место ряда рядом с картинкой, но не шире 260 px; длинную цитату
 * обрезает сама amo. Уже 90 px цитата не читается — тогда плашка встаёт над картинкой.
 */
const QUOTE_MAX_WIDTH_PX = 260;
const QUOTE_MIN_WIDTH_PX = 90;

/**
 * Картинка в пузыре сдвинута от его края на `p-2` минус выход обёртки медиа за отступ
 * (`-m-1`): плашка отсчитывается от того же места, чтобы её верх совпал с верхом картинки, а
 * между ними было 10 px.
 */
const MEDIA_INSET_PX = 4;
const QUOTE_GAP_PX = 10 - MEDIA_INSET_PX;

/**
 * Что ещё занимает ряд рядом с пузырём: слот чекбокса выбора сообщений (`size-5`) у края ряда
 * и, у входящего под заголовком автора, аватар (`w-11.5`).
 */
const ROW_CHECKBOX_PX = 20;
const ROW_AVATAR_PX = 46;
const ROW_RESERVE_PX = QUOTE_GAP_PX + ROW_CHECKBOX_PX;
const AVATAR_ROW_RESERVE_PX = ROW_RESERVE_PX + ROW_AVATAR_PX;

/**
 * Пузырь стикера — стикер и его отступы в пузыре; пузырь GIF amo не шире 65% ряда, и рядом
 * с ним остаётся не меньше 35%.
 */
const STICKER_BUBBLE_MAX_PX = STICKER_MAX_SIDE_PX + 2 * MEDIA_INSET_PX;
const GIF_FREE_ROW_SHARE = 35;

/**
 * Над зоной наведения пузыря (`::after`, поверх соседнего места ряда) и панелью действий
 * (`z-20`): иначе клик по цитате ушёл бы им.
 */
const QUOTE_Z_INDEX = 30;

/**
 * Варианты плашки по осям «стикер или GIF» и «есть ли в ряду аватар»: у каждого своё место
 * рядом с картинкой и свой порог узкого ряда.
 *
 * @param selectors — цели стиля разметки
 * @returns варианты плашки
 */
const quoteLayoutsOf = ({
  gifQuote,
  stickerQuote,
  withAvatar,
}: MessageSelectors): QuoteLayout[] => {
  return [
    { selector: gifQuote, media: 'gif', reservePx: ROW_RESERVE_PX },
    { selector: stickerQuote, media: 'sticker', reservePx: ROW_RESERVE_PX },
    {
      selector: `${withAvatar}${gifQuote}`,
      media: 'gif',
      reservePx: AVATAR_ROW_RESERVE_PX,
    },
    {
      selector: `${withAvatar}${stickerQuote}`,
      media: 'sticker',
      reservePx: AVATAR_ROW_RESERVE_PX,
    },
  ];
};

/**
 * Пузырь стикера не шире стикера с отступами, и место рядом — ряд минус пузырь; пузырь GIF —
 * доля ряда, и рядом остаётся `GIF_FREE_ROW_SHARE`. Порог узкого ряда — ширина, при которой
 * это место стало бы уже `QUOTE_MIN_WIDTH_PX`.
 *
 * @param layout — вариант плашки
 * @returns свободное место рядом с картинкой (выражение `calc`) и порог узкого ряда, px
 */
const quoteRoomOf = ({ media, reservePx }: QuoteLayout): QuoteRoom => {
  switch (media) {
    case 'gif': {
      return {
        freeCalc: `${GIF_FREE_ROW_SHARE}cqw - ${reservePx}px`,
        narrowRowPx: Math.ceil(
          ((QUOTE_MIN_WIDTH_PX + reservePx) * 100) / GIF_FREE_ROW_SHARE
        ),
      };
    }

    case 'sticker': {
      return {
        freeCalc: `100cqw - ${STICKER_BUBBLE_MAX_PX + reservePx}px`,
        narrowRowPx: QUOTE_MIN_WIDTH_PX + STICKER_BUBBLE_MAX_PX + reservePx,
      };
    }

    default: {
      const unknownMedia: never = media;

      throw new Error(`Unknown quote media: ${String(unknownMedia)}`);
    }
  }
};

/**
 * Сбоку плашка не шире свободного места; в узком ряду встаёт над картинкой шириной с неё —
 * `width: 0` не даёт ей растянуть пузырь, `min-width` растягивает по картинке, которая
 * выходит за отступ пузыря на `MEDIA_INSET_PX` с каждой стороны. `min-width` сильнее
 * `max-width` бокового режима.
 *
 * @param layout — вариант плашки
 * @returns CSS ширины плашки и её узкого режима
 */
const quoteLayoutCss = (layout: QuoteLayout) => {
  const { selector } = layout;
  const { freeCalc, narrowRowPx } = quoteRoomOf(layout);

  return `${selector} {
  max-width: min(${QUOTE_MAX_WIDTH_PX}px, calc(${freeCalc}));
}
@container ${REPLY_CONTAINER} (width < ${narrowRowPx}px) {
  ${selector} {
    position: static;
    width: 0;
    min-width: calc(100% + ${2 * MEDIA_INSET_PX}px);
    margin: 0 -${MEDIA_INSET_PX}px ${QUOTE_GAP_PX + MEDIA_INSET_PX}px;
  }
}`;
};

/**
 * Сторона места под стикер из переменной контейнера: размер контейнера, вписанный в
 * `STICKER_MAX_SIDE_PX` с сохранением пропорций и без увеличения. amo уже вписал натуральный
 * размер в свой предел без увеличения, а вписать в предел и потом в лимит — то же, что сразу в
 * лимит.
 *
 * @param side — переменная своей стороны
 * @returns выражение CSS для `width` или `height`
 */
const fittedSide = (side: '--media-w' | '--media-h') => {
  return `min(calc(var(${side}) * 1px), calc(${STICKER_MAX_SIDE_PX}px * var(${side}) / max(var(--media-w), var(--media-h))))`;
};

/**
 * Место под картинку amo задаёт inline `width` / `height` контейнера над `img` — его размер
 * сбрасывается или пересчитывается, `!important` — только против inline-стиля amo.
 *
 * Размер по картинке: контейнер в `auto`, картинка вписывается в лимит сама — до загрузки
 * размер не известен. Размер по контейнеру: место встаёт в итоговый размер ещё в заглушке, а
 * картинка заполняет его, как у amo, поэтому её появление ничего не сдвигает; заливка заглушки
 * снимается, спиннер остаётся.
 *
 * @param sizing — чем задан размер места под стикер в разметке
 * @returns CSS размера стикера
 */
const stickerSizingCss = (sizing: StickerSizing) => {
  switch (sizing.by) {
    case 'image': {
      return `${sizing.frame} {
  width: auto !important;
  height: auto !important;
}
${sizing.image} {
  width: auto;
  height: auto;
  max-width: ${STICKER_MAX_SIDE_PX}px;
  max-height: ${STICKER_MAX_SIDE_PX}px;
}`;
    }

    case 'frame': {
      return `${sizing.frame} {
  width: ${fittedSide('--media-w')} !important;
  height: ${fittedSide('--media-h')} !important;
}
${sizing.placeholder} {
  background: none;
}`;
    }

    default: {
      const unknownSizing: never = sizing;

      throw new Error(`Unknown sticker sizing: ${JSON.stringify(unknownSizing)}`);
    }
  }
};

/**
 * Ответ нашей картинкой — тоже своё сообщение: картинка выглядит как без ответа, а цитата
 * выносится плашкой рядом с ней, как в Telegram. У сообщения под заголовком автора
 * скрывается строка имени.
 *
 * Кнопка медиа стикера держит `min-width` / `min-height: 100px` — сбрасывается, иначе вокруг
 * стикера осталась бы пустая рамка прежнего размера. `object-fit: contain` — у всех наших
 * картинок: при `object-cover` и неполном сбросе размеров стикер обрезался бы. Оверлей времени и
 * статуса не трогается.
 *
 * @param selectors — цели стиля одной разметки amo
 * @returns CSS своих сообщений в этой разметке
 */
export const messageCss = (selectors: MessageSelectors) => {
  const {
    bubble,
    tail,
    backdrop,
    author,
    image,
    stickerButton,
    stickerSizing,
    quote,
    replyRow,
    replyControls,
    outgoing,
  } = selectors;

  return `
${bubble} {
  background: none;
  box-shadow: none;
  border-radius: 0;
}
${tail},
${backdrop},
${author} {
  display: none;
}
${image} {
  object-fit: contain;
}
${stickerButton} {
  min-width: 0;
  min-height: 0;
  width: auto;
}
${stickerSizingCss(stickerSizing)}
${quote} {
  position: absolute;
  top: ${MEDIA_INSET_PX}px;
  left: calc(100% + ${QUOTE_GAP_PX}px);
  z-index: ${QUOTE_Z_INDEX};
  width: max-content;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-radius: ${BUBBLE_RADIUS};
  box-shadow: ${BUBBLE_SHADOW};
  background: ${BUBBLE_BACKGROUND.incoming};
}
html.dark ${quote} {
  background: ${BUBBLE_BACKGROUND.incomingDark};
}
${outgoing}${quote} {
  left: auto;
  right: calc(100% + ${QUOTE_GAP_PX}px);
  background: ${BUBBLE_BACKGROUND.outgoing};
}
html.dark ${outgoing}${quote} {
  background: ${BUBBLE_BACKGROUND.outgoingDark};
}
${replyRow} {
  container: ${REPLY_CONTAINER} / inline-size;
}
${quoteLayoutsOf(selectors).map(quoteLayoutCss).join('\n')}
${replyControls} {
  top: auto;
  bottom: 0;
}
`;
};
