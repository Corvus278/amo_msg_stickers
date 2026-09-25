import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { AnimationItem } from 'lottie-web';
import lottie from 'lottie-web/build/player/lottie_light_canvas';

import {
  type CanvasBox,
  type Decorate,
  type Frame,
  type FrameSet,
  type GifResult,
  type IndexedFrame,
  type SourceKind,
  type ToStickerGifOptions,
} from './convert.types';
import { readTgs } from './tgs';

/**
 * amo отправляет PNG/WebP как JPEG с белым фоном, без изменений проходит только GIF.
 * Поэтому любой стикер/анимацию приводим к GIF с 1-битной прозрачностью.
 */

/**
 * Родной размер стикеров Telegram; меньше — мыло на Retina.
 */
export const STICKER_SIZE = 512;

/**
 * Если GIF не влезает в бюджет, пробуем меньшие стороны по очереди.
 */
const FALLBACK_SIZES = [384, 320, 256];
const MAX_GIF_BYTES = 2 * 1024 * 1024;
const MAX_FRAMES = 100;
const MAX_DURATION_SEC = 4;

/**
 * 40 мс = ровно 4 сотых: у GIF задержка в сотых, дробные fps «плывут» по скорости.
 */
const ANIMATION_FPS = 25;
const ALPHA_THRESHOLD = 128;
const OPAQUE_ALPHA = 255;

/**
 * Байт на пиксель в RGBA-буфере.
 */
const CHANNELS = 4;

/**
 * Предел палитры GIF; при прозрачности один индекс резервируется под прозрачный цвет.
 */
const MAX_COLORS = 256;

/**
 * Упорядоченный дизеринг (Байер 4×4) убирает «кольца» на градиентах при 256 цветах.
 * В отличие от Флойда–Стейнберга узор привязан к координатам и не мерцает в анимации.
 */
const DITHER_STRENGTH = 12;

/**
 * Средняя ошибка цвета без дизеринга, выше которой он включается (плоские заливки
 * обходятся без него).
 */
const DITHER_MIN_ERROR = 1;
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => {
  return ((v + 0.5) / 16 - 0.5) * DITHER_STRENGTH;
});

/**
 * Ошибку цвета считаем по каждому 7-му пикселю: для решения о дизеринге выборки
 * хватает, а полный проход по кадру 512×512 заметно дороже.
 */
const ERROR_SAMPLE_STEP = 7;

/**
 * Disposal «очистить до фона» перед следующим кадром, иначе прозрачные анимации
 * «пачкаются»; -1 — поведение gifenc по умолчанию для статичной картинки.
 */
const DISPOSE_RESTORE_BACKGROUND = 2;
const DISPOSE_DEFAULT = -1;
const PASSTHROUGH_GIF_BYTES = MAX_GIF_BYTES;
const EVENT_TIMEOUT_MS = 10_000;

/**
 * Задержка кадра, если декодер её не сообщил, и нижняя граница: задержку в 0–1
 * сотую браузеры заменяют на 100 мс, и анимация резко замедлилась бы.
 */
const DEFAULT_FRAME_DELAY_MS = 100;
const MIN_FRAME_DELAY_MS = 20;

/**
 * webm без индекса отдаёт duration=Infinity, пока не прыгнуть в конец: seek
 * заведомо дальше любой длительности.
 */
const SEEK_TO_END_SEC = 1e9;
const DEFAULT_LOTTIE_FPS = 60;

/**
 * Пропорции подписи от высоты стикера: кегль, отступ базовой линии от низа,
 * толщина обводки от кегля и максимальная ширина строки от ширины стикера.
 */
const CAPTION_SIZE_RATIO = 0.13;
const CAPTION_BOTTOM_RATIO = 0.3;
const CAPTION_STROKE_RATIO = 1 / 5;
const CAPTION_MIN_STROKE = 2;
const CAPTION_MAX_WIDTH_RATIO = 0.94;

const fit = (w: number, h: number, max: number): [number, number] => {
  const k = Math.min(1, max / Math.max(w, h));

  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
};

const makeCanvas = (w: number, h: number): CanvasBox => {
  const canvas = document.createElement('canvas');

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.imageSmoothingQuality = 'high';

  return { canvas, ctx };
};

const once = (
  target: EventTarget,
  event: string,
  timeoutMs = EVENT_TIMEOUT_MS
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      return reject(new Error(`timeout: ${event}`));
    }, timeoutMs);

    target.addEventListener(
      event,
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
};

/**
 * Ждёт загрузки Lottie-анимации, но не дольше таймаута: по его истечении
 * раскадровка идёт с тем, что успело загрузиться.
 */
const lottieLoaded = (anim: AnimationItem, timeoutMs = EVENT_TIMEOUT_MS) => {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const removeListener = anim.addEventListener('DOMLoaded', () => {
      clearTimeout(timer);
      removeListener();
      resolve();
    });
  });
};

/**
 * Средняя по каналам ошибка непрозрачных пикселей (по выборке каждого
 * `ERROR_SAMPLE_STEP`-го).
 */
const meanError = (rgba: Uint8ClampedArray, index: Uint8Array, palette: number[][]) => {
  let sum = 0;
  let count = 0;

  for (let p = 0; p < index.length; p += ERROR_SAMPLE_STEP) {
    const i = p * CHANNELS;

    if ((rgba[i + 3] || 0) < ALPHA_THRESHOLD) continue;
    const [r = 0, g = 0, b = 0] = palette[index[p] || 0] || [];

    sum +=
      Math.abs((rgba[i] || 0) - r) +
      Math.abs((rgba[i + 1] || 0) - g) +
      Math.abs((rgba[i + 2] || 0) - b);
    count++;
  }

  return count ? sum / count / 3 : 0;
};

/**
 * Палитра строится в rgb565 (65k корзин) только по непрозрачным пикселям,
 * прозрачность — отдельный зарезервированный индекс. rgba4444 из gifenc даёт
 * всего 16 уровней на канал: полосы на градиентах и сдвиг оттенков.
 */
const indexFrame = (rgba: Uint8ClampedArray, width: number): IndexedFrame => {
  const pixels = rgba.length / CHANNELS;
  const opaque = new Uint8Array(rgba.length);
  let opaqueBytes = 0;

  for (let p = 0; p < pixels; p++) {
    const i = p * CHANNELS;

    if ((rgba[i + 3] || 0) >= ALPHA_THRESHOLD) {
      opaque[opaqueBytes] = rgba[i] || 0;
      opaque[opaqueBytes + 1] = rgba[i + 1] || 0;
      opaque[opaqueBytes + 2] = rgba[i + 2] || 0;
      opaque[opaqueBytes + 3] = OPAQUE_ALPHA;
      opaqueBytes += CHANNELS;
    }
  }

  const hasTransparent = opaqueBytes < rgba.length;

  if (!opaqueBytes) {
    return {
      index: new Uint8Array(pixels),
      palette: [
        [0, 0, 0],
        [0, 0, 0],
      ],
      hasTransparent,
      transparentIndex: 0,
    };
  }

  const palette = quantize(
    opaque.subarray(0, opaqueBytes),
    hasTransparent ? MAX_COLORS - 1 : MAX_COLORS,
    { format: 'rgb565' }
  );

  let index = applyPalette(rgba, palette, 'rgb565');

  if (meanError(rgba, index, palette) > DITHER_MIN_ERROR) {
    const dithered = new Uint8ClampedArray(rgba.length);

    for (let p = 0; p < pixels; p++) {
      const i = p * CHANNELS;
      /**
       * Ячейка матрицы 4×4 — младшие два бита строки и столбца пикселя.
       */
      const d = BAYER_4[((Math.floor(p / width) & 3) << 2) | ((p % width) & 3)] || 0;

      dithered[i] = (rgba[i] || 0) + d;
      dithered[i + 1] = (rgba[i + 1] || 0) + d;
      dithered[i + 2] = (rgba[i + 2] || 0) + d;
      dithered[i + 3] = rgba[i + 3] || 0;
    }

    index = applyPalette(dithered, palette, 'rgb565');
  }

  let transparentIndex = 0;

  if (hasTransparent) {
    transparentIndex = palette.length;
    palette.push([0, 0, 0]);

    for (let p = 0; p < pixels; p++) {
      if ((rgba[p * CHANNELS + 3] || 0) < ALPHA_THRESHOLD) index[p] = transparentIndex;
    }
  }

  return { index, palette, hasTransparent, transparentIndex };
};

export const encodeGif = (frames: Frame[], width: number, height: number): Blob => {
  const gif = GIFEncoder();
  const isAnimated = frames.length > 1;

  for (const { data, delay } of frames) {
    const { index, palette, hasTransparent, transparentIndex } = indexFrame(
      data.data,
      width
    );

    gif.writeFrame(index, width, height, {
      palette,
      delay,
      transparent: hasTransparent,
      transparentIndex,
      dispose: isAnimated ? DISPOSE_RESTORE_BACKGROUND : DISPOSE_DEFAULT,
    });
  }

  gif.finish();

  return new Blob([gif.bytes()], { type: 'image/gif' });
};

const scaleFrames = (
  frames: Frame[],
  width: number,
  height: number,
  max: number
): FrameSet => {
  const [w, h] = fit(width, height, max);
  const src = makeCanvas(width, height);
  const dst = makeCanvas(w, h);
  const scaled = frames.map(({ data, delay }) => {
    src.ctx.putImageData(data, 0, 0);
    dst.ctx.clearRect(0, 0, w, h);
    dst.ctx.drawImage(src.canvas, 0, 0, w, h);

    return { data: dst.ctx.getImageData(0, 0, w, h), delay };
  });

  return { frames: scaled, width: w, height: h };
};

/**
 * Кодирует в исходном размере и уменьшает, пока GIF не влезет в MAX_GIF_BYTES.
 */
const encodeWithinBudget = (
  frames: Frame[],
  width: number,
  height: number
): GifResult => {
  let blob = encodeGif(frames, width, height);
  let result: GifResult = { blob, width, height };
  const side = Math.max(width, height);

  for (const size of FALLBACK_SIZES) {
    if (result.blob.size <= MAX_GIF_BYTES) break;
    if (size >= side) continue;
    const scaled = scaleFrames(frames, width, height, size);

    blob = encodeGif(scaled.frames, scaled.width, scaled.height);
    result = { blob, width: scaled.width, height: scaled.height };
  }

  return result;
};

const imageFrames = async (
  blob: Blob,
  max: number,
  decorate?: Decorate
): Promise<FrameSet> => {
  if (
    typeof ImageDecoder !== 'undefined' &&
    blob.type &&
    (await ImageDecoder.isTypeSupported(blob.type))
  ) {
    const decoder = new ImageDecoder({ data: blob.stream(), type: blob.type });

    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack!;
    const count = Math.min(track.frameCount, MAX_FRAMES);
    let canvasBox: CanvasBox | null = null;
    let size: [number, number] = [1, 1];
    const frames: Frame[] = [];

    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i });

      if (!canvasBox) {
        size = fit(image.displayWidth, image.displayHeight, max);
        canvasBox = makeCanvas(...size);
      }

      const { ctx } = canvasBox;
      const [w, h] = size;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(image, 0, 0, w, h);
      decorate?.(ctx, w, h);
      frames.push({
        data: ctx.getImageData(0, 0, w, h),
        /**
         * `VideoFrame.duration` — в микросекундах.
         */
        delay: image.duration
          ? Math.max(MIN_FRAME_DELAY_MS, image.duration / 1000)
          : DEFAULT_FRAME_DELAY_MS,
      });
      image.close();
    }

    decoder.close();

    return { frames, width: size[0], height: size[1] };
  }

  const bitmap = await createImageBitmap(blob);
  const [w, h] = fit(bitmap.width, bitmap.height, max);
  const { ctx } = makeCanvas(w, h);

  ctx.drawImage(bitmap, 0, 0, w, h);
  decorate?.(ctx, w, h);
  bitmap.close();

  return {
    frames: [{ data: ctx.getImageData(0, 0, w, h), delay: 0 }],
    width: w,
    height: h,
  };
};

const videoFrames = async (
  blob: Blob,
  max: number,
  decorate?: Decorate,
  fps = ANIMATION_FPS
): Promise<FrameSet> => {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');

  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;

  try {
    await once(video, 'loadeddata');

    if (!Number.isFinite(video.duration)) {
      video.currentTime = SEEK_TO_END_SEC;
      await once(video, 'seeked');
    }

    const duration = Math.min(video.duration || 1, MAX_DURATION_SEC);
    const [w, h] = fit(video.videoWidth, video.videoHeight, max);
    const { ctx } = makeCanvas(w, h);
    const frames: Frame[] = [];
    const step = 1 / fps;

    for (let t = 0; t < duration && frames.length < MAX_FRAMES; t += step) {
      video.currentTime = t;
      await once(video, 'seeked');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);
      decorate?.(ctx, w, h);
      frames.push({ data: ctx.getImageData(0, 0, w, h), delay: 1000 / fps });
    }

    return { frames, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const tgsFrames = async (
  blob: Blob,
  max: number,
  decorate?: Decorate,
  fps = ANIMATION_FPS
): Promise<FrameSet> => {
  const json = await readTgs(blob);
  const [w, h] = fit(json.w, json.h, max);
  const { ctx } = makeCanvas(w, h);

  /**
   * Каст — из-за типов lottie-web: они требуют `container` даже для canvas-рендера
   * с готовым `context`, которому контейнер не нужен.
   */
  const anim = lottie.loadAnimation({
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: json,
    rendererSettings: {
      context: ctx,
      clearCanvas: true,
      dpr: 1,
      preserveAspectRatio: 'xMidYMid meet',
    },
  } as Parameters<typeof lottie.loadAnimation>[0]);

  try {
    if (!anim.isLoaded) await lottieLoaded(anim);
    const sourceFps = json.fr || DEFAULT_LOTTIE_FPS;
    const total = Math.min(anim.totalFrames, sourceFps * MAX_DURATION_SEC);
    const frameStep = Math.max(1, sourceFps / fps);
    const frames: Frame[] = [];

    for (let f = 0; f < total && frames.length < MAX_FRAMES; f += frameStep) {
      anim.goToAndStop(f, true);
      decorate?.(ctx, w, h);
      frames.push({
        data: ctx.getImageData(0, 0, w, h),
        /**
         * При исходных fps ниже целевых шаг равен одному кадру, поэтому задержку
         * берём от реального шага, а не от целевых fps.
         */
        delay: (frameStep / sourceFps) * 1000,
      });
    }

    return { frames, width: w, height: h };
  } finally {
    anim.destroy();
  }
};

const sourceFrames = (
  blob: Blob,
  kind: SourceKind,
  max: number,
  decorate?: Decorate
): Promise<FrameSet> => {
  switch (kind) {
    case 'tgs': {
      return tgsFrames(blob, max, decorate);
    }

    case 'video': {
      return videoFrames(blob, max, decorate);
    }

    case 'image': {
      return imageFrames(blob, max, decorate);
    }

    default: {
      const unknownKind: never = kind;

      throw new Error(`Unknown source kind: ${String(unknownKind)}`);
    }
  }
};

export const detectKind = (blob: Blob, fileName = ''): SourceKind => {
  const name = fileName.toLowerCase();

  if (name.endsWith('.tgs') || blob.type === 'application/x-tgsticker') return 'tgs';
  if (blob.type.startsWith('video/') || name.endsWith('.webm') || name.endsWith('.mp4'))
    return 'video';

  return 'image';
};

export const toStickerGif = async (
  blob: Blob,
  kind: SourceKind,
  opts: ToStickerGifOptions = {}
): Promise<GifResult> => {
  const { decorate } = opts;
  const max = opts.max || STICKER_SIZE;

  if (
    kind === 'image' &&
    blob.type === 'image/gif' &&
    !decorate &&
    blob.size <= PASSTHROUGH_GIF_BYTES
  ) {
    const bitmap = await createImageBitmap(blob);
    const result = { blob, width: bitmap.width, height: bitmap.height };

    bitmap.close();

    return result;
  }

  const { frames, width, height } = await sourceFrames(blob, kind, max, decorate);

  if (!frames.length) throw new Error('Не удалось извлечь кадры');

  return encodeWithinBudget(frames, width, height);
};

/**
 * Подпись снизу стикера: белый текст с тёмной обводкой, как в мемах.
 */
export const captionDecorator = (text: string): Decorate => {
  return (ctx, w, h) => {
    const size = Math.round(h * CAPTION_SIZE_RATIO);

    ctx.save();
    ctx.font = `bold ${size}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(CAPTION_MIN_STROKE, size * CAPTION_STROKE_RATIO);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const x = w / 2;
    const y = h - size * CAPTION_BOTTOM_RATIO;
    const maxWidth = w * CAPTION_MAX_WIDTH_RATIO;

    ctx.strokeText(text, x, y, maxWidth);
    ctx.fillText(text, x, y, maxWidth);
    ctx.restore();
  };
};
