import { describe, expect, it } from 'vitest';

import { inspectGif } from '../src/core/gif';

import { makeGif } from './helpers/makeGif';

const TEXT = new TextEncoder();

describe('inspectGif', () => {
  it('разбирает статичный GIF', () => {
    expect(inspectGif(makeGif(16, 8))).toEqual({ width: 16, height: 8, frames: 1 });
  });

  it('считает кадры анимации', () => {
    expect(inspectGif(makeGif(4, 4, 3))).toEqual({ width: 4, height: 4, frames: 3 });
  });

  it('принимает GIF без trailer', () => {
    const gif = makeGif(4, 4, 2);

    expect(inspectGif(gif.subarray(0, -1))).toEqual({ width: 4, height: 4, frames: 2 });
  });

  it('отклоняет GIF, обрезанный до конца первого кадра', () => {
    const gif = makeGif(16, 16);

    expect(inspectGif(gif.subarray(0, gif.length - 4))).toBeNull();
  });

  it('отклоняет PNG', () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0,
    ]);

    expect(inspectGif(png)).toBeNull();
  });

  it('отклоняет HTML', () => {
    expect(inspectGif(TEXT.encode('<!doctype html><html>not found</html>'))).toBeNull();
  });

  it('отклоняет одну сигнатуру без кадров', () => {
    expect(inspectGif(TEXT.encode('GIF89a'))).toBeNull();
  });

  it('отклоняет GIF с заголовком и trailer, но без кадров', () => {
    const header = makeGif(4, 4).subarray(0, 13);

    header[10] = 0;

    expect(inspectGif(new Uint8Array([...header, 0x3b]))).toBeNull();
  });

  it('отклоняет нулевые размеры', () => {
    const gif = makeGif(4, 4);

    gif[6] = 0;
    gif[7] = 0;

    expect(inspectGif(gif)).toBeNull();
  });
});
