import type { FunctionComponent as FC } from 'preact';

import { usePickerView } from '../usePickerView/usePickerView';

import { BackIcon } from './BackIcon/BackIcon';
import type { ScreenProps } from './Screen.types';

/**
 * `z-10` — над содержимым режима: позиционированные элементы ленты идут в DOM раньше
 * экрана, но с `z-index` перекрыли бы его.
 */
const SCREEN_CLASS = 'absolute inset-0 z-10 flex flex-col bg-white-0 dark:bg-gray-10';

const BACK_BUTTON_CLASS = [
  'flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-transparent py-0 pl-0.5 pr-2',
  'font-primary text-xsm leading-[normal] text-cadetGray-30',
  'hover:bg-cadetGray-30/[.14] dark:text-gray-70 dark:hover:bg-white-0/[.07]',
].join(' ');

/**
 * Экран поверх режима. Режим под ним остаётся в раскладке, поэтому прокрутка ленты и
 * запрос поиска переживают «Назад» как есть, без восстановления.
 */
export const Screen: FC<ScreenProps> = (props) => {
  const { children } = props;
  const { closeScreen } = usePickerView();

  const handleBackClick = () => {
    closeScreen();
  };

  return (
    <div className={SCREEN_CLASS}>
      <div className="flex shrink-0 px-1.5 pt-1.5">
        <button type="button" className={BACK_BUTTON_CLASS} onClick={handleBackClick}>
          <BackIcon />
          Назад
        </button>
      </div>

      {children}
    </div>
  );
};
