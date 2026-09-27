import { describe, expect, it } from 'vitest';

import { stickerCellName } from '../src/core/ui/Picker/cellName/cellName';

describe('stickerCellName', () => {
  it('у стикера с подписью имя — подпись, а не эмодзи', () => {
    expect(stickerCellName({ emoji: '😀', caption: 'привет' })).toBe('стикер «привет»');
  });

  it('у стикера без подписи имя — эмодзи', () => {
    expect(stickerCellName({ emoji: '😀' })).toBe('стикер 😀');
  });

  it('пустая подпись не считается подписью', () => {
    expect(stickerCellName({ emoji: '😀', caption: '' })).toBe('стикер 😀');
  });

  it('без подписи и эмодзи — просто «стикер»', () => {
    expect(stickerCellName({ emoji: '' })).toBe('стикер');
  });
});
