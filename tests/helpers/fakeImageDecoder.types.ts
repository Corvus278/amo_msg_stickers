export type FakeImageDecoderInit = {
  /**
   * Число кадров дорожки.
   */
  frameCount: number;

  /**
   * Ширина каждого кадра в пикселях.
   */
  width: number;

  /**
   * Высота каждого кадра в пикселях.
   */
  height: number;

  /**
   * Длительность кадра по номеру в микросекундах; нет элемента — `null`, как у статичной картинки.
   */
  durations: number[];

  /**
   * Ответ `ImageDecoder.isTypeSupported`.
   */
  isSupported: boolean;
};

export type FakeDecodeOptions = {
  /**
   * Номер кадра, который нужно декодировать.
   */
  frameIndex: number;
};
