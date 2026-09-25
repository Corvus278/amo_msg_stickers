export type Frame = {
  /**
   * Пиксели кадра.
   */
  data: ImageData;

  /**
   * Длительность показа кадра в мс; 0 — статичная картинка.
   */
  delay: number;
};

/**
 * Кадры источника, уже вписанные в итоговый размер.
 */
export type FrameSet = {
  /**
   * Кадры в порядке показа. Пустой массив — источник не дал ни одного кадра.
   */
  frames: Frame[];

  /**
   * Ширина кадров в пикселях.
   */
  width: number;

  /**
   * Высота кадров в пикселях.
   */
  height: number;
};

export type GifResult = {
  /**
   * Готовая GIF.
   */
  blob: Blob;

  /**
   * Ширина GIF в пикселях.
   */
  width: number;

  /**
   * Высота GIF в пикселях.
   */
  height: number;
};

export type Decorate = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export type ToStickerGifOptions = {
  /**
   * Максимальная сторона результата в пикселях. По умолчанию — `STICKER_SIZE`.
   */
  max?: number;

  /**
   * Дорисовка поверх каждого кадра (например, подпись). undefined — без дорисовки.
   */
  decorate?: Decorate | undefined;
};

export type SourceKind = 'tgs' | 'video' | 'image';

export type CanvasBox = {
  /**
   * Холст, на котором рисуется кадр.
   */
  canvas: HTMLCanvasElement;

  /**
   * 2d-контекст холста с `willReadFrequently`: из него постоянно читаются пиксели.
   */
  ctx: CanvasRenderingContext2D;
};

/**
 * Кадр, переведённый в индексы палитры GIF.
 */
export type IndexedFrame = {
  /**
   * Индекс цвета палитры для каждого пикселя.
   */
  index: Uint8Array;

  /**
   * Палитра кадра в rgb; при прозрачности последний цвет — зарезервированный прозрачный.
   */
  palette: number[][];

  /**
   * Есть ли в кадре прозрачные пиксели.
   */
  hasTransparent: boolean;

  /**
   * Индекс прозрачного цвета в палитре; имеет смысл только при `hasTransparent`.
   */
  transparentIndex: number;
};

/**
 * Поля Lottie JSON, нужные для раскадровки.
 */
export type LottieJson = {
  /**
   * Ширина композиции в пикселях.
   */
  w: number;

  /**
   * Высота композиции в пикселях.
   */
  h: number;

  /**
   * Исходная частота кадров. Нет — считаем 60.
   */
  fr?: number;
};

export const isLottieJson = (value: unknown): value is LottieJson => {
  return (
    !!value &&
    typeof value === 'object' &&
    'w' in value &&
    typeof value.w === 'number' &&
    'h' in value &&
    typeof value.h === 'number' &&
    (!('fr' in value) || typeof value.fr === 'number')
  );
};
