import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../db.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { StickerCell } from '../StickerCell/StickerCell';
import { StickerGrid } from '../StickerGrid/StickerGrid';
import type { View } from '../usePickerView/usePickerView.types';
import { ViewBody } from '../ViewBody/ViewBody';
import { ViewHeader } from '../ViewHeader/ViewHeader';
import { ViewTitle } from '../ViewHeader/ViewTitle/ViewTitle';

import { useRecent } from './useRecent/useRecent';
import type { RecentViewProps } from './RecentView.types';

const RECENT_VIEW: View = { kind: 'recent' };

/**
 * Недавние отправки сеткой: повторная отправка кликом, удаление из недавних — ×.
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
        {entries.map(({ key, item, url, name }) => {
          return (
            <StickerCell
              key={key}
              item={item}
              url={url}
              name={name}
              onDelete={handleCellDelete}
            />
          );
        })}
      </StickerGrid>
    );
  };

  return (
    <>
      <ViewHeader>
        <ViewTitle title="Недавние" />
      </ViewHeader>

      <ViewBody view={RECENT_VIEW}>{renderEntries()}</ViewBody>
    </>
  );
};
