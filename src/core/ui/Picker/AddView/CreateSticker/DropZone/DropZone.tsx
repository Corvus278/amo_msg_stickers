import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC, TargetedDragEvent, TargetedEvent } from 'preact';
import { useState } from 'preact/hooks';

import { usePicker } from '../../../PickerProvider/usePicker';

import type { DropZoneProps } from './DropZone.types';

/**
 * Цвета обычной и подсвеченной зоны — взаимоисключающие наборы: конфликтующих утилит
 * на одном элементе быть не должно (`tailwind-merge` не берём).
 *
 * Наведение — простым `hover:`, а не `enabled:hover:`, как у кнопок: зона — `<label>`, у
 * него нет состояния доступности, и `:enabled` к нему не применяется. Наведение есть
 * только вне перетаскивания: подсветка перетаскивания и так заметнее.
 *
 * Длительность — под `motion-safe:`, как и переход: длительность по умолчанию из
 * `motion-safe:transition-*` перебила бы простую `duration-base`.
 */
const zoneVariants = cva(
  [
    'relative block cursor-pointer rounded-lgx border-[1.5px] border-dashed p-4 text-center',
    'motion-safe:transition-[color,background-color,border-color,filter] motion-safe:duration-base',
  ].join(' '),
  {
    variants: {
      isDragOver: {
        true: 'border-blue-50 text-blue-50 dark:border-beige-70 dark:text-beige-70',
        false: [
          'border-cadetGray-30/[.28] text-cadetGray-30 dark:border-white-0/[.1] dark:text-gray-70',
          'hover:border-cadetGray-30/[.5] hover:bg-cadetGray-30/[.06] hover:text-cadetGray-10',
          'dark:hover:border-white-0/[.2] dark:hover:bg-white-0/[.04] dark:hover:text-gray-90',
        ].join(' '),
      },
    },
  }
);

/**
 * Зона загрузки: поле выбора файла прозрачно и растянуто на всю зону, поэтому клик в
 * любом её месте открывает диалог, а перетаскивание подсвечивает рамку.
 */
export const DropZone: FC<DropZoneProps> = (props) => {
  const { fileName, onPick } = props;
  const { setHold } = usePicker();
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * Клик по полю открывает системный диалог, а курсор в это время уходит из окна: без
   * удержания попап закрылся бы, пока пользователь выбирает файл. Диалог закрывается
   * `change` (выбран новый файл) или `cancel` (отказ или тот же файл).
   */
  const handleFileClick = () => {
    setHold('fileDialog', true);
  };

  const handleFileCancel = () => {
    setHold('fileDialog', false);
  };

  const handleFileChange = (event: TargetedEvent<HTMLInputElement>) => {
    setHold('fileDialog', false);
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
        onClick={handleFileClick}
        onChange={handleFileChange}
        onCancel={handleFileCancel}
      />
    </label>
  );
};
