import type { FunctionComponent as FC } from 'preact';

import { copyText } from '../../../../clipboard';
import { t } from '../../../../i18n/translate';
import { MenuItem } from '../../Menu/MenuItem/MenuItem';
import { useMenuClose } from '../../Menu/useMenuClose/useMenuClose';
import { usePicker } from '../../PickerProvider/usePicker';

import type { CopyPackLinkItemProps } from './CopyPackLinkItem.types';

/**
 * Пункт «Копировать ссылку» меню пака. Меню закрывается первым, как у пункта предпросмотра:
 * оно возвращает фокус на кнопку «…», а статус копирования приходит позже, когда запись
 * в буфер закончилась. Удалось — статус «Ссылка на пак скопирована», не удалось — ошибка.
 */
export const CopyPackLinkItem: FC<CopyPackLinkItemProps> = (props) => {
  const { link } = props;
  const closeMenu = useMenuClose();
  const { showStatus, showError } = usePicker();

  const handleItemSelect = async () => {
    closeMenu();

    if (await copyText(link)) {
      showStatus(t('status.packLinkCopied'));
    } else {
      showError(t('error.copyLink'));
    }
  };

  return <MenuItem onSelect={handleItemSelect}>{t('pack.copyLink')}</MenuItem>;
};
