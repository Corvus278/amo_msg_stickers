import type { RefObject } from 'preact';

import type { RowRange, StickerLayout } from '../../stickerLayout/stickerLayout.types';
import type { FeedSticker } from '../feedSections/feedSections.types';

export type FeedWindow = {
  /**
   * Прокручиваемый элемент ленты.
   */
  scrollRef: RefObject<HTMLDivElement>;

  /**
   * Раскладка ленты; `null` — ширина ленты ещё не известна, рисовать нечего.
   */
  layout: StickerLayout<FeedSticker> | null;

  /**
   * Ряды раскладки, которые есть в документе: видимая область и запас вокруг неё.
   */
  range: RowRange;

  /**
   * Выбранный раздел: пока лента плавно едет по клику на вкладку — нажатый, иначе раздел, в
   * котором верх видимой области, а у ленты, прокрученной до конца, — последний; `null` — лента
   * пустая.
   */
  activeId: string | null;

  /**
   * Сообщает о прокрутке ленты: окно рядов пересчитывается не чаще кадра, а удержание нажатой
   * вкладки живёт, пока лента едет.
   */
  trackScroll: () => void;
};
