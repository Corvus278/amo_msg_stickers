import type { Closable, CoverBitmaps, CoverSize } from './coverBitmaps.types';

/**
 * Кэш битмапов обложек. Сбой декодирования в кэше не остаётся: следующий запрос того же ключа
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

  const get = (key: string, load: () => Promise<B>): Promise<B | null> => {
    const cached = entries.get(key);

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
        entries.delete(key);

        return null;
      }
    };

    const entry = decode();

    entries.set(key, entry);

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
 * Ключ кадра обложки в кэше. Кадр декодируется под сторону холста, а она меняется вместе с
 * `devicePixelRatio` и при открытом попапе — окно переехало на другой монитор, сменился масштаб
 * страницы. С ключом только по стикеру холст новой стороны получил бы кадр прежней: крупнее
 * квадрата и обрезанный или мельче него.
 *
 * @param id — id стикера-обложки
 * @param side — сторона холста обложки в пикселях
 * @returns ключ кадра
 */
export const coverBitmapKey = (id: string, side: number): string => {
  return `${id}:${side}`;
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
