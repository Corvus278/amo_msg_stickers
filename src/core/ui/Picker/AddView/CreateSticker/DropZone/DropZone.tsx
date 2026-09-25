import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC, TargetedDragEvent, TargetedEvent } from 'preact';
import { useState } from 'preact/hooks';

import type { DropZoneProps } from './DropZone.types';

/**
 * Цвета обычной и подсвеченной зоны — взаимоисключающие наборы: конфликтующих утилит
 * на одном элементе быть не должно (`tailwind-merge` не берём).
 */
const zoneVariants = cva(
  'relative block cursor-pointer rounded-lgx border-[1.5px] border-dashed p-4 text-center',
  {
    variants: {
      isDragOver: {
        true: 'border-blue-50 text-blue-50 dark:border-beige-70 dark:text-beige-70',
        false:
          'border-cadetGray-30/[.28] text-cadetGray-30 dark:border-white-0/[.1] dark:text-gray-70',
      },
    },
    defaultVariants: {
      isDragOver: false,
    },
  }
);

/**
 * Зона загрузки: поле выбора файла прозрачно и растянуто на всю зону, поэтому клик в
 * любом её месте открывает диалог, а перетаскивание подсвечивает рамку.
 */
export const DropZone: FC<DropZoneProps> = (props) => {
  const { fileName, onPick } = props;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: TargetedEvent<HTMLInputElement>) => {
    onPick(event.currentTarget.files?.[0]);
  };

  /**
   * Без `preventDefault` на `dragover` браузер не примет `drop` и откроет файл сам.
   */
  const handleZoneDragOver = (event: TargetedDragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleZoneDragLeave = () => {
    setIsDragOver(false);
  };

  /**
   * amo слушает `drop` на `body` и прикрепит файл к сообщению — не пускаем.
   */
  const handleZoneDrop = (event: TargetedDragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    onPick(event.dataTransfer?.files[0]);
  };

  return (
    <label
      className={zoneVariants({ isDragOver })}
      onDragOver={handleZoneDragOver}
      onDragLeave={handleZoneDragLeave}
      onDrop={handleZoneDrop}
    >
      <span>{fileName || 'Картинка, GIF, видео или .tgs — перетащите или кликните'}</span>

      <input
        type="file"
        accept="image/*,video/*,.tgs"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleFileChange}
      />
    </label>
  );
};
