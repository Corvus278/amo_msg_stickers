import type { Closable, CoverBitmaps, CoverSize } from './coverBitmaps.types';

/**
 * Кэш битмапов обложек. Сбой декодирования в кэше не остаётся: следующий запрос того же id
 * декодирует заново. Битмап, который декодировался после `close`, закрывается сразу — иначе память
 * кадра висела бы до сборки мусора.
 *
 * @returns кэш с `get` и `close`
 */
export const createCoverBitmaps = <B extends Closable>(): CoverBitmaps<B> => {
  const entries = new Map<string, Promise<B | null>>();

  /**
   * Готовые битмапы отдельно от промисов: `close` закрывает их сразу, а не в микрозадаче.
   */
  const ready = new Set<B>();
  let isClosed = false;

  const get = (id: string, load: () => Promise<B>): Promise<B | null> => {
    const cached = entries.get(id);

    if (cached) return cached;

    const decode = async (): Promise<B | null> => {
      try {
        const bitmap = await load();

        if (isClosed) {
          bitmap.close();

          return null;
        }

        ready.add(bitmap);

        return bitmap;
      } catch {
        entries.delete(id);

        return null;
      }
    };

    const entry = decode();

    entries.set(id, entry);

    return entry;
  };

  const close = () => {
    isClosed = true;

    for (const bitmap of ready) bitmap.close();

    ready.clear();
    entries.clear();
  };

  return { get, close };
};

/**
 * Размер кадра, вписанного в квадрат обложки с сохранением пропорций. Неизвестный размер
 * стикера (`0`) — кадр на весь квадрат.
 *
 * @param width — ширина стикера
 * @param height — высота стикера
 * @param side — сторона квадрата обложки в пикселях холста
 * @returns размер кадра, каждая сторона не меньше пикселя
 */
export const coverSize = (width: number, height: number, side: number): CoverSize => {
  if (!width || !height) return { width: side, height: side };

  const scale = side / Math.max(width, height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};
