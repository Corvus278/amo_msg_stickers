import type { FunctionComponent as FC } from 'preact';

import { SectionHeader } from '../SectionHeader/SectionHeader';
import { FEED_PANEL_ID, sectionTabId } from '../SectionTabs/sectionTabIds';
import type {
  FeedSection,
  FeedSticker,
} from '../StickersMode/feedSections/feedSections.types';

import { FeedRow } from './FeedRow/FeedRow';
import type { StickerFeedProps } from './StickerFeed.types';

/**
 * Отступы по бокам — у прокручиваемого элемента: ширина его содержимого, по которой считается
 * сторона ячейки, уже без них и без полосы прокрутки. Полоса — `feed-scroll` из `picker.css`.
 */
const FEED_CLASS = 'feed-scroll min-h-0 flex-1 overflow-y-auto px-2';

/**
 * Лента разделов режима «Стикеры»: контейнер высотой во всю ленту и в нём абсолютно поставленные
 * ряды окна — остальные ряды в документ не попадают.
 */
export const StickerFeed: FC<StickerFeedProps> = (props) => {
  const {
    sections,
    layout,
    range,
    activeId,
    scrollRef,
    onScroll,
    onCellDelete,
    onPackDelete,
    onRecentClear,
  } = props;
  const [from, to] = range;
  const byId = new Map<string, FeedSection>();

  for (const section of sections) byId.set(section.id, section);

  const handleFeedScroll = () => {
    onScroll();
  };

  const renderRows = () => {
    if (!layout) return null;

    return layout.rows.slice(from, to).map((row, offset) => {
      const { kind, sectionId, top, height } = row;
      const { title = '', hint = '' } = byId.get(sectionId) || {};

      const handleCellDelete = (cell: FeedSticker) => {
        onCellDelete(sectionId, cell);
      };

      switch (kind) {
        case 'header': {
          return (
            <SectionHeader
              key={from + offset}
              sectionId={sectionId}
              title={title}
              top={top}
              height={height}
              onPackDelete={onPackDelete}
              onRecentClear={onRecentClear}
            />
          );
        }

        case 'cells': {
          return (
            <FeedRow
              key={from + offset}
              row={row}
              hint={hint}
              onCellDelete={handleCellDelete}
            />
          );
        }

        default: {
          const unknownKind: never = kind;

          throw new Error(`Unknown sticker row: ${String(unknownKind)}`);
        }
      }
    });
  };

  return (
    <div
      ref={scrollRef}
      role="tabpanel"
      id={FEED_PANEL_ID}
      aria-labelledby={activeId ? sectionTabId(activeId) : undefined}
      className={FEED_CLASS}
      onScroll={handleFeedScroll}
    >
      <div className="relative" style={{ height: layout?.total || 0 }}>
        {renderRows()}
      </div>
    </div>
  );
};
