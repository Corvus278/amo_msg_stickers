import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../db.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { StickerCell } from '../StickerCell/StickerCell';
import { StickerGrid } from '../StickerGrid/StickerGrid';

import { useRecent } from './useRecent/useRecent';
import type { RecentViewProps } from './RecentView.types';

/**
 * Недавние отправки сеткой: повторная отправка кликом, удаление из недавних — ×.
 * `data-view` — метка для проверки переключения на стенде.
 */
export const RecentView: FC<RecentViewProps> = (props) => {
  const { isOpen } = props;
  const { entries, removeItem } = useRecent(isOpen);

  const handleCellDelete = (item: SendItem) => {
    void removeItem(item);
  };

  const renderEntries = () => {
    if (!entries) return null;

    if (!entries.length) {
      return <EmptyState>Здесь появятся отправленные стикеры и GIF</EmptyState>;
    }

    return (
      <StickerGrid>
        {entries.map(({ key, item, url }) => {
          return (
            <StickerCell key={key} item={item} url={url} onDelete={handleCellDelete} />
          );
        })}
      </StickerGrid>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5">
        <div className="flex min-h-5.5 items-center gap-2">
          <span className="flex-1 truncate font-semibold">Недавние</span>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]"
        data-view="recent"
      >
        {renderEntries()}
      </div>
    </>
  );
};
