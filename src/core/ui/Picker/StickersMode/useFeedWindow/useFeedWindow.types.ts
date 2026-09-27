import type { RefObject } from 'preact';

import type { RowRange, StickerLayout } from '../../stickerLayout/stickerLayout.types';
import type { FeedSticker } from '../feedSections/feedSections.types';

/**
 * Размеры видимой области ленты.
 */
export type FeedBox = {
  /**
   * Ширина содержимого без отступов и полосы прокрутки — по ней считается сторона ячейки.
   */
  width: number;

  /**
   * Высота видимой области.
   */
  height: number;
};

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
   * Раздел, в котором верх видимой области, а у ленты, прокрученной до конца, — последний;
   * `null` — лента пустая.
   */
  activeId: string | null;

  /**
   * Сообщает о прокрутке ленты: окно рядов пересчитывается не чаще кадра.
   */
  trackScroll: () => void;
};
