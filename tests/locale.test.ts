import { afterEach, describe, expect, it, vi } from 'vitest';

import { AMO_LOCALE_KEY, readAmoLocale, resolveLocale } from '../src/core/i18n/locale';

/**
 * @param getItem — чтение хранилища страницы
 * @param languages — языки браузера
 * @param language — основной язык браузера
 */
const stubPage = (
  getItem: (key: string) => string | null,
  languages: readonly string[],
  language = ''
) => {
  vi.stubGlobal('localStorage', { getItem });
  vi.stubGlobal('navigator', { languages, language });
};

describe('resolveLocale', () => {
  it.each(['en-US', 'EN', 'en_GB', 'en'])('%s → en', (tag) => {
    expect(resolveLocale(tag, [])).toBe('en');
    expect(resolveLocale(null, [tag])).toBe('en');
  });

  it.each(['ru-RU', 'de-DE', ''])('%s → ru', (tag) => {
    expect(resolveLocale(tag, [])).toBe('ru');
  });

  it('без сохранённого языка и языков браузера → ru', () => {
    expect(resolveLocale(null, [])).toBe('ru');
    expect(resolveLocale('', [])).toBe('ru');
  });

  it('сохранённый язык важнее языков браузера', () => {
    expect(resolveLocale('en', ['ru-RU'])).toBe('en');
    expect(resolveLocale('ru', ['en-US'])).toBe('ru');
  });

  it('пустой сохранённый язык → первый язык браузера', () => {
    expect(resolveLocale('', ['en-US', 'ru-RU'])).toBe('en');
    expect(resolveLocale(null, ['ru-RU', 'en-US'])).toBe('ru');
  });
});

describe('readAmoLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('читает язык amo из localStorage по ключу i18nextLng', () => {
    const getItem = vi.fn((key: string) => {
      return key === AMO_LOCALE_KEY ? 'en' : null;
    });

    stubPage(getItem, ['ru-RU']);

    expect(readAmoLocale()).toBe('en');
    expect(getItem).toHaveBeenCalledWith('i18nextLng');
  });

  it('без значения в localStorage берёт navigator.languages', () => {
    stubPage(() => {
      return null;
    }, ['en-GB']);

    expect(readAmoLocale()).toBe('en');
  });

  it('при бросающем localStorage берёт navigator.languages', () => {
    stubPage(() => {
      throw new Error('SecurityError');
    }, ['en-GB']);

    expect(readAmoLocale()).toBe('en');
  });

  it('при пустых navigator.languages берёт navigator.language', () => {
    stubPage(
      () => {
        return null;
      },
      [],
      'en-US'
    );

    expect(readAmoLocale()).toBe('en');
  });
});
