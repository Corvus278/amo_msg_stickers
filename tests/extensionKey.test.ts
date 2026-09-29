import { createHash, createPublicKey } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import manifest from '../src/extension/manifest.json';

/**
 * ID карточки в Chrome Web Store. Архив из релиза получает его же только с ключом этой карточки: с другим ключом
 * распакованное расширение и версия из стора — разные установки со своими настройками.
 */
const STORE_EXTENSION_ID = 'abjnjphijggkkdbbmkldhibgepgdcgip';

/**
 * Первая буква алфавита ID: Chrome пишет шестнадцатеричную цифру `n` буквой со сдвигом `n` от `a`.
 */
const ID_ALPHABET_START = 'a'.codePointAt(0) || 0;

/**
 * Ключ из manifest в байтах DER.
 *
 * @param key — публичный ключ из manifest, base64 DER
 * @returns байты ключа
 */
const keyBytes = (key: string) => {
  return Uint8Array.from(Buffer.from(key, 'base64'));
};

/**
 * ID расширения так, как его считает Chrome: SHA-256 от DER ключа, первые 16 байт, каждая шестнадцатеричная цифра
 * `0–f` — буква `a–p`.
 *
 * @param key — публичный ключ из manifest, base64 DER
 * @returns ID расширения
 */
const extensionId = (key: string) => {
  const hex = createHash('sha256').update(keyBytes(key)).digest('hex').slice(0, 32);

  return [...hex]
    .map((digit) => {
      return String.fromCodePoint(ID_ALPHABET_START + Number.parseInt(digit, 16));
    })
    .join('');
};

describe('ключ расширения', () => {
  it('разбирается как публичный ключ', () => {
    expect(() => {
      return createPublicKey({
        key: Buffer.from(keyBytes(manifest.key)),
        format: 'der',
        type: 'spki',
      });
    }).not.toThrow();
  });

  it('даёт ID карточки Chrome Web Store', () => {
    expect(extensionId(manifest.key)).toBe(STORE_EXTENSION_ID);
  });
});
