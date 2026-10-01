/**
 * Длина строки base64 в PEM.
 */
const PEM_LINE_LENGTH = 64;

/**
 * @param pkcs8 — закрытый ключ PKCS#8 в DER, как его отдаёт `crypto.subtle.exportKey('pkcs8', …)`
 * @returns ключ в PEM, как в JSON-ключе сервисного аккаунта Google
 */
export const privateKeyPem = (pkcs8: ArrayBuffer) => {
  const base64 = btoa(String.fromCodePoint(...new Uint8Array(pkcs8)));
  const lines = base64.match(new RegExp(`.{1,${PEM_LINE_LENGTH}}`, 'g')) || [];

  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
};
