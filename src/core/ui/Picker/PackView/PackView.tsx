import type { FunctionComponent as FC } from 'preact';

import { CUSTOM_PACK_ID } from '../../../db';
import type { SendItem } from '../../../db.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { StickerCell } from '../StickerCell/StickerCell';
import { StickerGrid } from '../StickerGrid/StickerGrid';
import { ViewBody } from '../ViewBody/ViewBody';
import { ViewHeader } from '../ViewHeader/ViewHeader';
import { ViewTitle } from '../ViewHeader/ViewTitle/ViewTitle';

import { DeletePackButton } from './DeletePackButton/DeletePackButton';
import { usePack } from './usePack/usePack';
import type { PackViewProps } from './PackView.types';

/**
 * Стикеры пака сеткой: отправка кликом, удаление стикера — ×, удаление пака целиком —
 * кнопкой в шапке, кроме «Моих стикеров».
 */
export const PackView: FC<PackViewProps> = (props) => {
  const { packId } = props;
  const { pack, stickers, removeSticker, removePack } = usePack(packId);
  const isCustomPack = packId === CUSTOM_PACK_ID;

  const handleCellDelete = (item: SendItem) => {
    if (item.kind === 'local') void removeSticker(item.stickerId);
  };

  const handlePackDeleteConfirm = () => {
    void removePack();
  };

  const renderStickers = () => {
    if (!stickers) return null;

    if (!stickers.length) {
      return (
        <EmptyState>
          {isCustomPack ? 'Создайте свой стикер во вкладке «+»' : 'Пак пуст'}
        </EmptyState>
      );
    }

    return (
      <StickerGrid>
        {stickers.map(({ id, item, url }) => {
          return (
            <StickerCell key={id} item={item} url={url} onDelete={handleCellDelete} />
          );
        })}
      </StickerGrid>
    );
  };

  return (
    <>
      <ViewHeader>
        <ViewTitle title={pack?.title}>
          {/**
           * Ключ — id пака: подтверждение, взведённое в одном паке, не переезжает в
           * другой при переключении вкладок.
           */}
          {pack && !isCustomPack && (
            <DeletePackButton key={packId} onConfirm={handlePackDeleteConfirm} />
          )}
        </ViewTitle>
      </ViewHeader>

      <ViewBody view={{ kind: 'pack', packId }}>{renderStickers()}</ViewBody>
    </>
  );
};
