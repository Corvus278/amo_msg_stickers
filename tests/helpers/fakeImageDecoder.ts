import type { FakeDecodeOptions, FakeImageDecoderInit } from './fakeImageDecoder.types';

/**
 * Подставной кадр `ImageDecoder`: считает, сколько кадров открыто и не закрыто.
 */
export class FakeVideoFrame {
  static open = 0;

  displayWidth: number;

  displayHeight: number;

  duration: number | null;

  constructor(width: number, height: number, duration: number | null) {
    this.displayWidth = width;
    this.displayHeight = height;
    this.duration = duration;
    FakeVideoFrame.open += 1;
  }

  close() {
    FakeVideoFrame.open -= 1;
  }
}

/**
 * Подставной `ImageDecoder` для окружения `node`: параметры декодера тест задаёт в
 * `FakeImageDecoder.init` до открытия источника.
 */
export class FakeImageDecoder {
  static init: FakeImageDecoderInit = {
    frameCount: 1,
    width: 512,
    height: 512,
    durations: [],
    supported: true,
  };

  static instances: FakeImageDecoder[] = [];

  static isTypeSupported = async () => {
    return FakeImageDecoder.init.supported;
  };

  tracks = {
    ready: Promise.resolve(),
    selectedTrack: { frameCount: FakeImageDecoder.init.frameCount },
  };

  completed = Promise.resolve();

  /**
   * Номера кадров всех вызовов `decode` по порядку.
   */
  decoded: number[] = [];

  isClosed = false;

  constructor() {
    FakeImageDecoder.instances.push(this);
  }

  decode = async ({ frameIndex }: FakeDecodeOptions) => {
    const { width, height, durations } = FakeImageDecoder.init;

    this.decoded.push(frameIndex);

    /**
     * `??`, а не `||`: длительность 0 фейк отдаёт как есть, как её вернул бы декодер, —
     * разбор 0 остаётся за `frameDelayMs`, а `null` значит только «элемента нет».
     */
    return { image: new FakeVideoFrame(width, height, durations[frameIndex] ?? null) };
  };

  close() {
    this.isClosed = true;
  }
}
