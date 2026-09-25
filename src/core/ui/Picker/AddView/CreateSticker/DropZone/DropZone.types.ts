export type DropZoneProps = {
  /**
   * Имя выбранного файла — показывается вместо подсказки; `null` — файл не выбран.
   */
  fileName: string | null;

  /**
   * Колбэк на выбор файла кликом или перетаскиванием; `undefined` — файла в выборе нет.
   */
  onPick: (file: File | undefined) => void;
};
