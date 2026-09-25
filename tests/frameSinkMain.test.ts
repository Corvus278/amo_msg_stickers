import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMainThreadSink } from '../src/core/frameSinkMain';
import { createGifEncoder } from '../src/core/gifEncoder';

const SIZE = 4;

/**
 * Кадр из пикселей одного цвета.
 *
 * @param value — значение каналов r, g, b
 * @returns rgba-буфер кадра `SIZE` × `SIZE`
 */
const solidFrame = (value: number) => {
  return new Uint8ClampedArray(SIZE * SIZE * 4).map((_, i) => {
    return i % 4 === 3 ? 255 : value;
  });
};

const OPTIONS = { width: SIZE, height: SIZE, isAnimated: true };

describe('createMainThreadSink', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('уступает поток после кадра: write ждёт таймер', async () => {
    vi.useFakeTimers();
    const sink = createMainThreadSink(OPTIONS);
    const onWritten = vi.fn();

    const written = sink.write(solidFrame(10), 40).then(onWritten);

    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(1);
    expect(onWritten).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    await written;
    expect(onWritten).toHaveBeenCalledOnce();
  });

  it('кодирует тем же кодировщиком: байты и вес совпадают', async () => {
    const sink = createMainThreadSink(OPTIONS);
    const encoder = createGifEncoder(OPTIONS);

    for (const [index, value] of [10, 200].entries()) {
      await sink.write(solidFrame(value), 40 + index);
      encoder.write(solidFrame(value), 40 + index);
    }

    expect(sink.byteLength).toBe(encoder.byteLength);
    expect(await sink.finish()).toEqual(encoder.finish());
  });
});
