import type { GifResult } from '../../../convert.types';

/**
 * Готовый стикер черновика и object URL его превью: URL живёт ровно столько, сколько
 * черновик.
 */
export type StickerDraft = {
  /**
   * GIF, который уйдёт в «Мои стикеры».
   */
  gif: GifResult;

  /**
   * Object URL превью этого GIF.
   */
  url: string;
};

export type StickerDraftState = {
  /**
   * Имя выбранного файла; `null` — файл ещё не выбран.
   */
  fileName: string | null;

  /**
   * Подпись, как её ввёл пользователь.
   */
  caption: string;

  /**
   * Object URL превью готового стикера; `null` — превью нет: файл не выбран или
   * конвертация не удалась.
   */
  previewUrl: string | null;

  /**
   * Стикер готов, не пересобирается и ещё не сохраняется: его можно сохранить.
   */
  isSavable: boolean;

  /**
   * Выбирает исходный файл; `undefined` — выбор отменён, черновик не меняется.
   */
  pickFile: (file: File | undefined) => void;

  /**
   * Меняет подпись: стикер пересобирается через 500 мс после последнего ввода.
   */
  changeCaption: (caption: string) => void;

  /**
   * Сохраняет стикер в конец «Моих стикеров» и открывает этот пак. Промис не
   * отклоняется: ошибка уходит в статус.
   */
  save: () => Promise<void>;
};
