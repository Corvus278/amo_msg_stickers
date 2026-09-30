import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SendComposer } from '../src/core/amoDom.types';
import { setLocale } from '../src/core/i18n/translate';
import type { PageClient, PageSendResult } from '../src/core/pageClient.types';
import { SendError, sendFile, toCheckedGifFile, toGifFile } from '../src/core/sender';

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

/**
 * Поле ввода amo без DOM: «Отправить» видна, когда в поле есть текст или вложение, а
 * paste файла делает её видимой — как amo, принявший вложение.
 *
 * @param hasDraft — в поле уже есть текст
 * @returns композер и шпионы вставки и клика
 */
const fakeComposer = (hasDraft: boolean) => {
  let isSendShown = hasDraft;
  const shownClass = {
    contains: () => {
      return isSendShown;
    },
  };
  const paste = vi.fn(() => {
    isSendShown = true;

    return true;
  });
  const click = vi.fn();
  const composer: SendComposer = {
    editable: {
      focus: vi.fn(),
      dispatchEvent: paste,
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    },
    sendButton: { classList: shownClass, click },
    cancelEditButton: null,
  };

  return { click, composer, paste };
};

const clientAnswering = (result: PageSendResult): PageClient => {
  return {
    send: vi.fn(() => {
      return result;
    }),
  };
};

describe('sendFile', () => {
  const file = new File([makeGif(8, 8)], GIF_NAME, { type: 'image/gif' });

  it('amo принял в очередь — поле не трогается, «Отправить» не нажимается', async () => {
    const { click, composer, paste } = fakeComposer(true);
    const client = clientAnswering({ status: 'accepted' });

    await sendFile(composer, file, client);

    expect(client.send).toHaveBeenCalledWith(composer.editable, file);
    expect(paste).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('очередь недоступна, поле пустое — вставка и «Отправить»', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      return undefined;
    });
    vi.stubGlobal(
      'DataTransfer',
      class {
        readonly items = { add: vi.fn() };
      }
    );
    vi.stubGlobal('ClipboardEvent', class extends Event {});

    const { click, composer, paste } = fakeComposer(false);

    await sendFile(
      composer,
      file,
      clientAnswering({ status: 'unavailable', reason: 'no-agent' })
    );

    expect(paste).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('очередь недоступна, в поле текст — SendError без вставки', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      return undefined;
    });

    const { click, composer, paste } = fakeComposer(true);

    await expect(
      sendFile(
        composer,
        file,
        clientAnswering({ status: 'unavailable', reason: 'no-client' })
      )
    ).rejects.toBeInstanceOf(SendError);
    expect(paste).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  setLocale('ru');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
