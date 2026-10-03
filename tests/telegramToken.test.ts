import { describe, expect, it } from 'vitest';

import { readTelegramToken } from '../scripts/telegramToken';

describe('readTelegramToken', () => {
  it.each([undefined, '', '  \n'])('без значения («%s») — пустая строка', (value) => {
    expect(readTelegramToken(value)).toBe('');
  });

  it('отдаёт валидный токен как есть', () => {
    expect(readTelegramToken('123456:AAH-abc_DEF')).toBe('123456:AAH-abc_DEF');
  });

  it('обрезает пробелы и перевод строки вокруг токена', () => {
    expect(readTelegramToken(' 123456:AAH-abc_DEF\r\n')).toBe('123456:AAH-abc_DEF');
  });

  it.each(['bad', '123456', 'abc:def', '123:abc def', ':abc', '123:'])(
    'отклоняет «%s» без самого значения в тексте ошибки',
    (value) => {
      expect(() => {
        return readTelegramToken(value);
      }).toThrow(/формат/);

      try {
        readTelegramToken(value);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(String(error)).not.toContain(value);
      }
    }
  );
});
