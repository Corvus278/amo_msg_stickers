import type { FunctionComponent as FC, TargetedEvent } from 'preact';
import { useMemo } from 'preact/hooks';

import type { RemoteGif } from '../../../db.types';

import { GridHeader } from './GridHeader/GridHeader';
import { MasonryCell } from './MasonryCell/MasonryCell';
import { splitColumns, visibleTiles } from './splitColumns/splitColumns';
import type { MasonrySection, MasonryTile } from './splitColumns/splitColumns.types';
import { COLUMN_COUNT, columnWidth, GRID_GAP, tileBox } from './tileBox/tileBox';
import { useGridWindow } from './useGridWindow/useGridWindow';
import type { MasonryGridProps } from './MasonryGrid.types';

/**
 * Отступы по бокам — у прокручиваемого элемента: ширина его содержимого, по которой считается
 * ширина колонки, уже без них и без полосы прокрутки. Полоса — `feed-scroll` из `picker.css`.
 */
const GRID_CLASS = 'feed-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2';

const SKELETON_CLASS = 'absolute rounded-lg bg-cadetGray-30/[.12] dark:bg-white-0/[.06]';

/**
 * Лента GIF в две колонки с сохранением пропорций: GIF разной формы, и квадратная сетка
 * обрезала бы их или оставляла пустоты.
 *
 * Ячейки лежат в документе в порядке выдачи и стоят абсолютно на местах из раскладки: порядок
 * Tab и скринридера совпадает с порядком выдачи, а не идёт колонка за колонкой. В документе
 * только плитки видимой области и по её высоте запаса сверху и снизу — GIF вне экрана не
 * декодируются и не проигрываются. Содержимое после ленты (подсказка, подпись источника) —
 * `children` под её плитками.
 */
export const MasonryGrid: FC<MasonryGridProps> = (props) => {
  const { sections, resetKey, children, onScroll, onRecentRemove, onRecentClear } = props;
  const { scrollRef, width, viewport, scrollTop, trackScroll } = useGridWindow(resetKey);
  const column = columnWidth(width);

  const layout = useMemo(() => {
    if (!column) return null;

    const masonry = sections.map(
      ({ id, title, items, skeletons }): MasonrySection<RemoteGif> => {
        return { id, items, hasHeader: Boolean(title), skeletons };
      }
    );

    return splitColumns(masonry, { count: COLUMN_COUNT, width: column, gap: GRID_GAP });
  }, [sections, column]);

  const tiles = layout ? visibleTiles(layout.tiles, scrollTop, viewport, viewport) : [];
  const recentId = sections.find(({ isRecent }) => {
    return isRecent;
  })?.id;

  const handleGridScroll = (event: TargetedEvent<HTMLDivElement>) => {
    trackScroll();
    onScroll(event.currentTarget);
  };

  const handleRecentRemove = (gif: RemoteGif) => {
    onRecentRemove(gif);
  };

  const handleRecentClear = () => {
    onRecentClear();
  };

  const renderTile = (tile: MasonryTile<RemoteGif>) => {
    const { kind, sectionId } = tile;

    switch (kind) {
      case 'item': {
        const { item } = tile;

        return (
          <MasonryCell
            key={`${sectionId}:${item.provider}:${item.id}`}
            gif={item}
            box={tileBox(tile, column)}
            onRemove={sectionId === recentId ? handleRecentRemove : undefined}
          />
        );
      }

      case 'header': {
        const { title = '' } =
          sections.find(({ id }) => {
            return id === sectionId;
          }) || {};

        return (
          <GridHeader
            key={`header:${sectionId}`}
            title={title}
            top={tile.top}
            height={tile.height}
            onClear={sectionId === recentId ? handleRecentClear : undefined}
          />
        );
      }

      case 'skeleton': {
        return (
          <div
            key={`skeleton:${sectionId}:${tile.index}`}
            aria-hidden="true"
            className={SKELETON_CLASS}
            style={tileBox(tile, column)}
          />
        );
      }

      default: {
        const unknownKind: never = kind;

        throw new Error(`Unknown masonry tile: ${String(unknownKind)}`);
      }
    }
  };

  return (
    <div ref={scrollRef} className={GRID_CLASS} onScroll={handleGridScroll}>
      <div className="relative" style={{ height: layout?.total || 0 }}>
        {tiles.map(renderTile)}
      </div>

      {children}
    </div>
  );
};
