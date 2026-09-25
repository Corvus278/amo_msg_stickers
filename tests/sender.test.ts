import { describe, expect, it } from 'vitest';

import { SendError, toCheckedGifFile } from '../src/core/sender';

import { makeGif } from './helpers/makeGif';

describe('toCheckedGifFile', () => {
  it('отдаёт GIF файлом image/gif с исходными байтами', async () => {
    const bytes = makeGif(8, 8, 2);
    const file = await toCheckedGifFile(new Blob([bytes], { type: 'text/html' }), 'gif');

    expect(file.type).toBe('image/gif');
    expect(file.name).toBe('gif.gif');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
  });

  it.each([
    ['HTML', new Blob(['<html>404</html>'])],
    ['обрезанный GIF', new Blob([makeGif(16, 16).subarray(0, 30)])],
  ])('отклоняет %s', async (_name, blob) => {
    const result = toCheckedGifFile(blob);

    await expect(result).rejects.toBeInstanceOf(SendError);
    await expect(result).rejects.toThrow('Файл не похож на GIF');
  });
});
