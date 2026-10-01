/**
 * @param segment — строка base64url без `=`, например сегмент JWT
 * @returns её байты
 */
export const fromBase64Url = (segment: string) => {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');

  return Uint8Array.from(atob(base64), (char) => {
    return char.codePointAt(0) || 0;
  });
};
