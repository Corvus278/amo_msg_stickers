declare module 'gifenc' {
  export type Palette = number[][];
  export type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444';
  export type WriteFrameOptions = {
    /**
     * Палитра кадра. Обязательна для первого кадра, дальше — локальная палитра.
     */
    palette?: Palette;

    /**
     * Длительность показа кадра в мс.
     */
    delay?: number;

    /**
     * Включить прозрачность: цвет `transparentIndex` не рисуется.
     */
    transparent?: boolean;

    /**
     * Индекс прозрачного цвета в палитре.
     */
    transparentIndex?: number;

    /**
     * Повторы анимации: 0 — бесконечно, -1 — без повтора.
     */
    repeat?: number;

    /**
     * Метод disposal GIF — что делать с кадром перед следующим; -1 — по умолчанию.
     */
    dispose?: number;
  };
  export type QuantizeOptions = {
    /**
     * Цветовой формат, в котором строится палитра.
     */
    format?: ColorFormat;

    /**
     * 1-битная альфа: true или порог прозрачности (0–255).
     */
    oneBitAlpha?: boolean | number;
  };
  export type Encoder = {
    /**
     * Дописывает кадр: индексы пикселей в палитре кадра.
     */
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ): void;

    /**
     * Закрывает поток GIF; после него `bytes()` отдаёт готовый файл.
     */
    finish(): void;

    /**
     * Байты GIF, записанные на текущий момент.
     */
    bytes(): Uint8Array<ArrayBuffer>;
  };
  export function GIFEncoder(): Encoder;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: QuantizeOptions
  ): Palette;
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: ColorFormat
  ): Uint8Array;
}

/**
 * CSS собирается плагином в `build.mjs` и приходит в бандл строкой: её вставляют
 * `<style>` в shadow root пикера. Экспорт по умолчанию — форма, которую даёт loader
 * `text` esbuild.
 */
declare module '*.css' {
  const css: string;
  export default css;
}

/**
 * Расширение глобального `Window` возможно только через `interface`: у `type` нет
 * слияния объявлений.
 */
interface Window {
  /**
   * Флаг запуска ядра: content script и userscript могут оказаться на одной странице,
   * а стартовать нужно один раз.
   */
  __amoStickers?: boolean;
}
