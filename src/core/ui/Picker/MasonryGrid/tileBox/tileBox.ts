import type { TilePlace, TileRect } from './tileBox.types';

/**
 * Число колонок ленты GIF.
 */
export const COLUMN_COUNT = 2;

/**
 * Зазор между колонками и между плитками в колонке, в пикселях — как у ленты стикеров.
 */
export const GRID_GAP = 4;

/**
 * Ширина колонки ленты GIF.
 *
 * @param width — ширина содержимого ленты без отступов и полосы прокрутки
 * @returns ширина колонки в пикселях; 0 — ширина ленты ещё не известна
 */
export const columnWidth = (width: number): number => {
  if (!width) return 0;

  return (width - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
};

/**
 * Прямоугольник плитки в ленте по её месту в раскладке.
 *
 * @param place — колонка, верх и высота плитки
 * @param width — ширина колонки
 * @returns позиция и размер плитки в пикселях
 */
export const tileBox = (place: TilePlace, width: number): TileRect => {
  const { column, top, height } = place;

  return { left: column * (width + GRID_GAP), top, width, height };
};
