/**
 * Квадратный непрозрачный кадр из пикселей одного цвета.
 *
 * @param size — сторона кадра в пикселях
 * @param value — значение каналов r, g, b
 * @returns rgba-буфер кадра `size` × `size`
 */
export const solidFrame = (size: number, value: number) => {
  return new Uint8ClampedArray(size * size * 4).map((_, i) => {
    return i % 4 === 3 ? 255 : value;
  });
};
