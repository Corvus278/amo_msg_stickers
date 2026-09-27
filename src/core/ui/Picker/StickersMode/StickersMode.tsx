import type { FunctionComponent as FC } from 'preact';

import { PackView } from '../PackView/PackView';
import { usePicker } from '../PickerProvider/usePicker';
import { RecentView } from '../RecentView/RecentView';
import { TAB_PANEL_ID, tabId } from '../tabIds/tabIds';
import { Tabs } from '../Tabs/Tabs';
import { usePickerView } from '../usePickerView/usePickerView';

import { sectionView } from './sectionView';
import type { StickersModeProps } from './StickersMode.types';

/**
 * Режим «Стикеры»: полоса вкладок разделов над открытым разделом — недавними или паком.
 * Раздел выбирает якорь `scrollToSection`.
 */
export const StickersMode: FC<StickersModeProps> = (props) => {
  const { isOpen } = props;
  const { packs } = usePicker();
  const { anchor } = usePickerView();
  const view = sectionView(anchor, packs);

  return (
    <>
      <Tabs />

      <div
        role="tabpanel"
        id={TAB_PANEL_ID}
        aria-labelledby={tabId(view)}
        className="flex min-h-0 flex-1 flex-col"
      >
        {view.kind === 'pack' ? (
          <PackView packId={view.packId} />
        ) : (
          <RecentView isOpen={isOpen} />
        )}
      </div>
    </>
  );
};
