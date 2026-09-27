import type { FunctionComponent as FC } from 'preact';

import type { SendItem } from '../../../db.types';
import { useCoverBitmaps } from '../PackCover/useCoverBitmaps/useCoverBitmaps';
import { SectionTabs } from '../SectionTabs/SectionTabs';
import { StickerFeed } from '../StickerFeed/StickerFeed';
import { RECENT_SECTION_ID } from '../usePickerView/sectionIds';

import { useFeedSections } from './useFeedSections/useFeedSections';
import { useFeedWindow } from './useFeedWindow/useFeedWindow';
import type { StickersModeProps } from './StickersMode.types';

/**
 * Режим «Стикеры»: полоса вкладок разделов над лентой всех разделов — недавних, «Моих стикеров» и
 * паков. Вкладки и лента делят окно ленты: выбранная вкладка — раздел в верху видимой области.
 */
export const StickersMode: FC<StickersModeProps> = (props) => {
  const { isOpen } = props;
  const { sections, isCurrent, removeSticker, removeRecent } = useFeedSections(isOpen);
  const { scrollRef, layout, range, activeId, trackScroll } = useFeedWindow(
    sections,
    isCurrent
  );
  const bitmaps = useCoverBitmaps(isOpen);

  const handleFeedScroll = () => {
    trackScroll();
  };

  const handleCellDelete = (sectionId: string, item: SendItem) => {
    if (sectionId === RECENT_SECTION_ID) {
      void removeRecent(item);
    } else if (item.kind === 'local') {
      void removeSticker(item.stickerId);
    }
  };

  return (
    <>
      <SectionTabs sections={sections || []} activeId={activeId} bitmaps={bitmaps} />

      <StickerFeed
        sections={sections || []}
        layout={layout}
        range={range}
        activeId={activeId}
        scrollRef={scrollRef}
        onScroll={handleFeedScroll}
        onCellDelete={handleCellDelete}
      />
    </>
  );
};
