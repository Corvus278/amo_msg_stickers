import { describe, expect, it } from 'vitest';

import { cellMenuItems } from '../src/core/ui/Picker/Menu/CellMenu/cellMenuItems/cellMenuItems';

describe('cellMenuItems', () => {
  it('найденная GIF без kind: один пункт «Предпросмотр»', () => {
    expect(cellMenuItems(undefined)).toEqual(['preview']);
  });

  it('недавняя GIF: «Предпросмотр», затем удаление', () => {
    expect(cellMenuItems('recent')).toEqual(['preview', 'remove']);
  });

  it('стикер из библиотеки: «Предпросмотр», затем удаление', () => {
    expect(cellMenuItems('sticker')).toEqual(['preview', 'remove']);
  });
});
