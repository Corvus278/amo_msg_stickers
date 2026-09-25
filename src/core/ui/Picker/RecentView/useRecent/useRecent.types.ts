import type { SendItem } from '../../../../db.types';

export type RecentEntry = {
  /**
   * Ключ записи недавних: уникален в списке.
   */
  key: string;

  /**
   * Что отправлять повторно.
   */
  item: SendItem;

  /**
   * Адрес картинки для ячейки: object URL своего стикера или превью GIF.
   */
  url: string;
};

export type Recent = {
  /**
   * Недавние от новых к старым; `null` — список ещё не прочитан.
   */
  entries: RecentEntry[] | null;

  /**
   * Убирает элемент из недавних и перечитывает список. Промис не отклоняется: ошибка
   * уходит в статус.
   */
  removeItem: (item: SendItem) => Promise<void>;
};
