import type { FunctionComponent as FC } from 'preact';

import { Menu } from '../Menu';

import { cellMenuItems } from './cellMenuItems/cellMenuItems';
import { PreviewItem } from './PreviewItem/PreviewItem';
import { RemoveItem } from './RemoveItem/RemoveItem';
import type { CellMenuProps } from './CellMenu.types';

/**
 * Контекстное меню ячейки стикера или GIF: «Предпросмотр» первым, затем удаление, если оно у
 * ячейки есть. Удаление живёт только здесь: кнопки удаления на ячейках заслоняли бы сетку.
 */
export const CellMenu: FC<CellMenuProps> = (props) => {
  const { label, kind, opening, onClose, onPreview, onRemove } = props;
  const { anchor, source } = opening;

  return (
    <Menu label={label} anchor={anchor} source={source} onClose={onClose}>
      {cellMenuItems(kind).map((item) => {
        switch (item) {
          case 'preview': {
            return <PreviewItem key={item} onPreview={onPreview} />;
          }

          case 'remove': {
            if (!kind || !onRemove) return null;

            return <RemoveItem key={item} kind={kind} onRemove={onRemove} />;
          }

          default: {
            const unknownItem: never = item;

            throw new Error(`Unknown cell menu item: ${String(unknownItem)}`);
          }
        }
      })}
    </Menu>
  );
};
