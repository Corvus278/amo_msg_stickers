export type GifEncoderOptions = {
  /**
   * Ширина каждого кадра в пикселях.
   */
  width: number;

  /**
   * Высота каждого кадра в пикселях.
   */
  height: number;

  /**
   * Анимация: кадры очищаются до фона перед следующим, иначе прозрачные области «пачкаются».
   */
  isAnimated: boolean;
};

export type GifEncoder = {
  /**
   * Индексирует кадр и дописывает его в GIF; буфер `rgba` после вызова не нужен.
   */
  write: (rgba: Uint8ClampedArray, delayMs: number) => void;

  /**
   * Вес GIF на текущий момент в байтах; после `finish` — вес готового файла.
   */
  readonly byteLength: number;

  /**
   * Закрывает GIF и отдаёт его байты; дальше писать кадры нельзя.
   */
  finish: () => Uint8Array<ArrayBuffer>;
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
