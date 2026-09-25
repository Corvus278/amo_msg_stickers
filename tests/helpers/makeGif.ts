import { GIFEncoder } from 'gifenc';

/**
 * Настоящий GIF из `gifenc` — тем же энкодером, что у проекта, а не байты руками.
 *
 * @param width — ширина
 * @param height — высота
 * @param frames — число кадров
 * @returns байты GIF
 */
export const makeGif = (width: number, height: number, frames = 1) => {
  const gif = GIFEncoder();
  const index = new Uint8Array(width * height);

  for (let i = 0; i < frames; i++) {
    gif.writeFrame(index, width, height, {
      palette: [
        [0, 0, 0],
        [255, 255, 255],
      ],
      delay: 40,
    });
  }

  gif.finish();

  return gif.bytes();
};
