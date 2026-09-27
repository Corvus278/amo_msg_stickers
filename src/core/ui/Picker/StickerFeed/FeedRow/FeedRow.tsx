import type { FunctionComponent as FC } from 'preact';

import { usePicker } from '../../PickerProvider/usePicker';
import { StickerCell } from '../../StickerCell/StickerCell';
import { COLUMNS, GAP } from '../../stickerLayout/stickerLayout';

import type { FeedRowProps } from './FeedRow.types';

/**
 * Колонки и зазор сетки — из констант раскладки, а не классами Tailwind: геометрия ряда уже
 * посчитана ими, и сетка должна совпасть с ней до пикселя.
 */
const GRID_STYLE = {
  gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
  columnGap: GAP,
};

const HEADER_CLASS =
  'absolute inset-x-0 m-0 flex items-center px-1 font-primary text-xsm font-semibold text-cadetGray-30 dark:text-gray-70';

const HINT_CLASS =
  'absolute inset-x-0 flex items-center justify-center px-4 text-center leading-normal text-cadetGray-30 dark:text-gray-70';

/**
 * Ряд ленты стикеров, абсолютно поставленный по своей геометрии: заголовок раздела, ряд до пяти
 * ячеек или подсказка пустого раздела. Object URL стикера создаётся здесь — только для ячеек в
 * окне ленты.
 */
export const FeedRow: FC<FeedRowProps> = (props) => {
  const { row, title, hint, onCellDelete } = props;
  const { urlOf } = usePicker();
  const { kind, top, height, items } = row;
  const position = { top, height };

  switch (kind) {
    case 'header': {
      return (
        <h2 className={HEADER_CLASS} style={position}>
          <span className="min-w-0 truncate">{title}</span>
        </h2>
      );
    }

    case 'cells': {
      if (!items.length) {
        return (
          <div className={HINT_CLASS} style={position}>
            {hint}
          </div>
        );
      }

      return (
        <div className="absolute inset-x-0 grid" style={{ ...position, ...GRID_STYLE }}>
          {items.map(({ key, item, sticker, name }) => {
            return (
              <StickerCell
                key={key}
                item={item}
                url={urlOf(sticker.id, sticker.blob)}
                name={name}
                onDelete={onCellDelete}
              />
            );
          })}
        </div>
      );
    }

    default: {
      const unknownKind: never = kind;

      throw new Error(`Unknown sticker row: ${String(unknownKind)}`);
    }
  }
};
