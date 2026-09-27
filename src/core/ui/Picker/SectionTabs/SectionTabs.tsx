import type { FunctionComponent as FC } from 'preact';

import { PackCover } from '../PackCover/PackCover';
import { PlusIcon } from '../PlusIcon/PlusIcon';
import { usePickerView } from '../usePickerView/usePickerView';

import { ClockIcon } from './ClockIcon/ClockIcon';
import { SectionTab } from './SectionTab/SectionTab';
import { useRevealTab } from './useRevealTab/useRevealTab';
import { ADD_TAB_ID, FEED_PANEL_ID, sectionTabId } from './sectionTabIds';
import type { SectionTabsProps } from './SectionTabs.types';

/**
 * Полоса прокручивается вбок, когда паков больше, чем влезает, — без видимого скроллбара: он
 * съел бы высоту вкладок. `relative` — от полосы считается `offsetLeft` вкладок.
 */
const STRIP_CLASS = [
  'relative flex shrink-0 items-center gap-0.5 overflow-x-auto px-1.5 py-1 [scrollbar-width:none]',
  'border-b border-cadetGray-30/[.28] dark:border-white-0/10',
].join(' ');

/**
 * Полоса вкладок разделов над лентой стикеров: «Недавние», паки в порядке ленты и «Добавить
 * стикеры». Вкладка раздела прокручивает ленту к его заголовку, выбранная — раздел в верху
 * видимой области. Пока выбранной нет, в порядке Tab стоит первая вкладка.
 */
export const SectionTabs: FC<SectionTabsProps> = (props) => {
  const { sections, activeId, bitmaps } = props;
  const { scrollToSection, openScreen } = usePickerView();
  const stripRef = useRevealTab(activeId);
  const hasActive = sections.some(({ id }) => {
    return id === activeId;
  });

  const handleAddSelect = () => {
    openScreen('add');
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label="Разделы стикеров"
      className={STRIP_CLASS}
    >
      {sections.map(({ id, title, pack, items }, index) => {
        const isSelected = id === activeId;

        const handleSectionSelect = () => {
          scrollToSection(id);
        };

        return (
          <SectionTab
            key={id}
            id={sectionTabId(id)}
            title={title}
            controlsId={FEED_PANEL_ID}
            isSelected={isSelected}
            isFocusable={hasActive ? isSelected : index === 0}
            onSelect={handleSectionSelect}
          >
            {pack ? (
              <PackCover pack={pack} items={items} bitmaps={bitmaps} />
            ) : (
              <ClockIcon />
            )}
          </SectionTab>
        );
      })}

      <SectionTab
        id={ADD_TAB_ID}
        title="Добавить стикеры"
        isSelected={false}
        isFocusable={!sections.length}
        onSelect={handleAddSelect}
      >
        <PlusIcon />
      </SectionTab>
    </div>
  );
};
