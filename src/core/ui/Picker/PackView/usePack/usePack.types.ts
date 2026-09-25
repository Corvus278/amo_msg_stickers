import type { Pack, SendItem } from '../../../../db.types';

export type PackSticker = {
  /**
   * id стикера в библиотеке.
   */
  id: string;

  /**
   * Что отправляет ячейка стикера.
   */
  item: SendItem;

  /**
   * Object URL картинки стикера.
   */
  url: string;
};

export type PackStickers = {
  /**
   * Пак, для которого прочитаны стикеры.
   */
  packId: string;

  /**
   * Стикеры пака в порядке добавления.
   */
  stickers: PackSticker[];
};

export type PackState = {
  /**
   * Открытый пак; `null` — пака больше нет в библиотеке, представление уходит в недавние.
   */
  pack: Pack | null;

  /**
   * Стикеры открытого пака; `null` — ещё не прочитаны.
   */
  stickers: PackSticker[] | null;

  /**
   * Удаляет стикер из библиотеки и отзывает его object URL.
   */
  removeSticker: (stickerId: string) => Promise<void>;

  /**
   * Удаляет пак со всеми стикерами и открывает недавние.
   */
  removePack: () => Promise<void>;
};
