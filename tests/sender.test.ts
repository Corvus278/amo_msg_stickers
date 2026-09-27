import { afterEach, describe, expect, it } from 'vitest';

import { setLocale } from '../src/core/i18n/translate';
import { SendError, toCheckedGifFile, toGifFile } from '../src/core/sender';

import { makeGif } from './helpers/makeGif';

const GIF_NAME = 'cat.amostk.k-gif.gif';

describe('toGifFile', () => {
  it.each([
    ['имя с меткой', '😀.amostk.k-sticker.gif'],
    ['имя без метки', 'amostk.k-sticker.gif'],
    ['имя без расширения', 'amostk.k-sticker'],
    ['имя с чужим расширением', 'sticker.png'],
  ])('кладёт %s в File.name как есть', (_case, name) => {
    const file = toGifFile(new Blob([makeGif(8, 8)]), name);

    expect(file.name).toBe(name);
    expect(file.type).toBe('image/gif');
  });
});

describe('toCheckedGifFile', () => {
  it('отдаёт GIF файлом image/gif с исходными байтами и переданным именем', async () => {
    const bytes = makeGif(8, 8, 2);
    const file = await toCheckedGifFile(
      new Blob([bytes], { type: 'text/html' }),
      GIF_NAME
    );

    expect(file.type).toBe('image/gif');
    expect(file.name).toBe(GIF_NAME);
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
  });

  it.each([
    ['HTML', new Blob(['<html>404</html>'])],
    ['обрезанный GIF', new Blob([makeGif(16, 16).subarray(0, 30)])],
  ])('отклоняет %s', async (_name, blob) => {
    const result = toCheckedGifFile(blob, GIF_NAME);

    await expect(result).rejects.toBeInstanceOf(SendError);
    await expect(result).rejects.toThrow('Файл не похож на GIF');
  });

  it('в английском интерфейсе отклоняет с английским текстом', async () => {
    setLocale('en');

    await expect(
      toCheckedGifFile(new Blob(['<html>404</html>']), GIF_NAME)
    ).rejects.toThrow('The file does not look like a GIF');
  });
});

afterEach(() => {
  setLocale('ru');
});
