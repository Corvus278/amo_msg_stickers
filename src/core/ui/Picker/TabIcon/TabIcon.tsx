import type { FunctionComponent as FC } from 'preact';

import { CUSTOM_PACK_ID } from '../../../db';

import { SmileIcon } from './SmileIcon/SmileIcon';
import { usePackCover } from './usePackCover/usePackCover';
import type { TabIconProps } from './TabIcon.types';

/**
 * Длина подписи вкладки пака без обложки: больше двух букв в 34px вкладки не влезает.
 */
const TITLE_LETTERS = 2;

/**
 * Иконка вкладки пака: обложка, а у пака без стикеров — смайл для «Моих стикеров» и
 * первые буквы названия для остальных. Пока обложка читается, вкладка пустая: иначе
 * при каждом открытии буквы мелькали бы перед картинкой.
 */
export const TabIcon: FC<TabIconProps> = (props) => {
  const { pack } = props;
  const cover = usePackCover(pack);

  if (!cover) return null;

  const { url } = cover;

  if (url) return <img src={url} alt="" className="size-6.5 object-contain" />;

  if (pack.id === CUSTOM_PACK_ID) return <SmileIcon />;

  return <>{pack.title.slice(0, TITLE_LETTERS)}</>;
};
