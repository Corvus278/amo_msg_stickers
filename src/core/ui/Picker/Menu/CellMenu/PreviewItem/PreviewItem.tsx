import type { FunctionComponent as FC } from 'preact';

import { t } from '../../../../../i18n/translate';
import { MenuItem } from '../../MenuItem/MenuItem';
import { useMenuClose } from '../../useMenuClose/useMenuClose';

import type { PreviewItemProps } from './PreviewItem.types';

/**
 * Пункт меню ячейки, открывающий закреплённый предпросмотр. Меню закрывается первым: оно
 * возвращает фокус на ячейку, а фокус на кнопку «Закрыть предпросмотр» ставит оверлей после
 * монтирования, то есть позже.
 */
export const PreviewItem: FC<PreviewItemProps> = (props) => {
  const { onPreview } = props;
  const closeMenu = useMenuClose();

  const handleItemSelect = () => {
    closeMenu();
    onPreview();
  };

  return <MenuItem onSelect={handleItemSelect}>{t('menu.preview')}</MenuItem>;
};
