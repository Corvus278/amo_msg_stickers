/**
 * Сжимает данные в gzip — так же, как Telegram упаковывает `.tgs`.
 *
 * @param data — текст или байты
 * @returns gzip-Blob
 */
export const gzip = async (data: string | Uint8Array<ArrayBuffer>) => {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));

  return new Response(stream).blob();
};
