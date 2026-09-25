import type { FunctionComponent as FC } from 'preact';

import { CUSTOM_PACK_ID } from '../../../db';
import type { SendItem } from '../../../db.types';
import { EmptyState } from '../EmptyState/EmptyState';
import { StickerCell } from '../StickerCell/StickerCell';
import { StickerGrid } from '../StickerGrid/StickerGrid';

import { DeletePackButton } from './DeletePackButton/DeletePackButton';
import { usePack } from './usePack/usePack';
import type { PackViewProps } from './PackView.types';

/**
 * Стикеры пака сеткой: отправка кликом, удаление стикера — ×, удаление пака целиком —
 * кнопкой в шапке, кроме «Моих стикеров». `data-view` — метка для проверки переключения
 * на стенде.
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
      <div className="flex flex-col gap-1.5 px-2.5 pb-1.5 pt-2.5">
        <div className="flex min-h-5.5 items-center gap-2">
          <span className="flex-1 truncate font-semibold">{pack?.title}</span>

          {/**
           * Ключ — id пака: подтверждение, взведённое в одном паке, не переезжает в
           * другой при переключении вкладок.
           */}
          {pack && !isCustomPack && (
            <DeletePackButton key={packId} onConfirm={handlePackDeleteConfirm} />
          )}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]"
        data-view="pack"
        data-pack-id={packId}
      >
        {renderStickers()}
      </div>
    </>
  );
};
