import { beforeEach, describe, expect, it, vi } from 'vitest';

import { putPack, putSticker } from '../src/core/db';
import { importTelegramSet } from '../src/core/sources/telegram';

import { fakeHost } from './helpers/fakeHost';

/**
 * Конвертации нужен canvas, а базе — IndexedDB: в Node их нет, и проверяем мы здесь
 * обращение к Bot API, а не их.
 */
vi.mock('../src/core/convert', () => {
  return {
    toStickerGif: vi.fn(async () => {
      return { blob: new Blob(['gif']), width: 512, height: 512 };
    }),
  };
});

vi.mock('../src/core/db', () => {
  return { putPack: vi.fn(async () => {}), putSticker: vi.fn(async () => {}) };
});

const TOKEN = '123456:secret';
const FILE_API = `https://api.telegram.org/file/bot${TOKEN}/`;

const sticker = (id: string) => {
  return { file_id: `f-${id}`, file_unique_id: id, is_animated: false, is_video: false };
};

/**
 * Bot API по методам: `getStickerSet` отдаёт `set`, `getFile` — путь из `paths` по
 * `file_id`.
 *
 * @param set — результат `getStickerSet`
 * @param paths — `file_path` по `file_id`
 * @returns ответ на запрос по адресу
 */
const botApi = (set: unknown, paths: Record<string, string> = {}) => {
  return (url: string) => {
    const { pathname, searchParams } = new URL(url);

    if (pathname.endsWith('/getStickerSet')) return { ok: true, result: set };
    const fileId = searchParams.get('file_id') || '';
    const filePath = fileId in paths ? paths[fileId] : `stickers/${fileId}.webp`;

    return { ok: true, result: { file_path: filePath } };
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('importTelegramSet', () => {
  it('не запрашивает файл с `..` в пути и продолжает импорт', async () => {
    const host = fakeHost({
      onJson: botApi(
        { name: 'Pack', title: 'Пак', stickers: [sticker('a'), sticker('b')] },
        { 'f-a': `../../bot${TOKEN}/sendMessage` }
      ),
    });
    const onProgress = vi.fn();

    await importTelegramSet(host, TOKEN, 'Pack', onProgress);

    expect(host.fetchBlob).toHaveBeenCalledTimes(1);
    expect(host.fetchBlob).toHaveBeenCalledWith(
      `${FILE_API}stickers/f-b.webp`,
      5 * 1024 * 1024
    );
    expect(putSticker).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenLastCalledWith({ done: 2, total: 2, title: 'Пак' });
  });

  it.each(['/etc/passwd', 'a?x=1', 'a#b', 'a%2e%2e/b', ''])(
    'не запрашивает файл по пути %j',
    async (path) => {
      const host = fakeHost({
        onJson: botApi(
          { name: 'Pack', title: 'Пак', stickers: [sticker('a')] },
          { 'f-a': path }
        ),
      });

      await importTelegramSet(host, TOKEN, 'Pack', vi.fn());

      expect(host.fetchBlob).not.toHaveBeenCalled();
    }
  );

  it('пропускает битый стикер, прогресс доходит до N/N', async () => {
    const broken = { file_id: 'f-x', is_animated: false, is_video: false };
    const host = fakeHost({
      onJson: botApi({
        name: 'Pack',
        title: 'Пак',
        stickers: [sticker('a'), broken, sticker('c')],
      }),
    });
    const onProgress = vi.fn();

    await importTelegramSet(host, TOKEN, 'Pack', onProgress);

    expect(putSticker).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith({ done: 3, total: 3, title: 'Пак' });
  });

  it.each([
    { name: 'Pack', title: 'Пак' },
    { name: '../evil', title: 'Пак', stickers: [] },
    { title: 'Пак', stickers: [] },
    null,
  ])('битый getStickerSet %j — ошибка, пак не создан', async (set) => {
    const host = fakeHost({ onJson: botApi(set) });

    await expect(importTelegramSet(host, TOKEN, 'Pack', vi.fn())).rejects.toThrow(
      'Telegram: неожиданный ответ'
    );
    expect(putPack).not.toHaveBeenCalled();
  });

  it('ответ не в формате Bot API — ошибка', async () => {
    const host = fakeHost({ json: '<html>' });

    await expect(importTelegramSet(host, TOKEN, 'Pack', vi.fn())).rejects.toThrow(
      'Telegram: неожиданный ответ'
    );
  });
});
