import type { FunctionComponent as FC } from 'preact';

import { ClearRecentButton } from './ClearRecentButton/ClearRecentButton';
import { headerAction } from './headerAction/headerAction';
import { PackMenuButton } from './PackMenuButton/PackMenuButton';
import type { SectionHeaderProps } from './SectionHeader.types';

const HEADER_CLASS = 'absolute inset-x-0 flex items-center gap-1 pl-1';

const TITLE_CLASS =
  'm-0 min-w-0 flex-1 truncate font-primary text-xsm font-semibold text-cadetGray-30 dark:text-gray-70';

/**
 * Заголовок раздела ленты: одна строка приглушённого названия и действие раздела справа.
 * Название сжимается многоточием, а действие не сжимается: длинное название его не сдвигает.
 */
export const SectionHeader: FC<SectionHeaderProps> = (props) => {
  const { sectionId, title, link, top, height, onPackDelete, onRecentClear } = props;

  const handleClearConfirm = () => {
    onRecentClear();
  };

  const handlePackDelete = () => {
    onPackDelete(sectionId);
  };

  const renderAction = () => {
    switch (headerAction(sectionId)) {
      case 'clear': {
        return <ClearRecentButton onConfirm={handleClearConfirm} />;
      }

      case 'menu': {
        return <PackMenuButton title={title} link={link} onDelete={handlePackDelete} />;
      }

      default: {
        return null;
      }
    }
  };

  return (
    <div className={HEADER_CLASS} style={{ top, height }}>
      <h2 className={TITLE_CLASS}>{title}</h2>

      {renderAction()}
    </div>
  );
};
