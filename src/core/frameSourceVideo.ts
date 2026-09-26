import type { FrameSource } from './frameSource.types';
import {
  ANIMATION_FPS,
  evenPlan,
  fit,
  planItem,
  waitForEvent,
} from './frameSourceCommon';

/**
 * webm без индекса отдаёт duration=Infinity, пока не прыгнуть в конец: seek
 * заведомо дальше любой длительности.
 */
const SEEK_TO_END_SEC = 1e9;

/**
 * Длительность, если видео её не сообщило (NaN или 0).
 */
const UNKNOWN_DURATION_SEC = 1;

/**
 * План кадров видео: равный шаг `1 / fps` от нуля, не дальше 4 с и не больше 100 кадров.
 * Позиция считается как `index / fps`, а не накоплением шага: сумма дробей копит ошибку и
 * на границе длительности добавила бы лишний кадр.
 *
 * @param duration — длительность видео в секундах; Infinity — обрезается до 4 с,
 *   NaN и 0 — считаются одной секундой
 * @param fps — частота захвата
 * @returns план кадров с позициями в секундах
 */
export const videoPlan = (duration: number, fps = ANIMATION_FPS) => {
  return evenPlan(duration || UNKNOWN_DURATION_SEC, 1, 1000 / fps, (index) => {
    return index / fps;
  });
};

/**
 * Открывает видео как источник кадров. `<video>` живёт до `dispose` и служит всем
 * проходам. Если видео не загрузилось (ошибка декодирования или таймаут), источник
 * освобождает его сам и отклоняется: вызывающему нечего освобождать.
 *
 * @param blob — файл видео
 * @param maxSide — предел большей стороны
 * @returns источник кадров видео
 */
export const openVideoSource = async (
  blob: Blob,
  maxSide: number
): Promise<FrameSource> => {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');

  /**
   * Без `src` и `load()` элемент держит декодер и буфер файла, пока его не соберёт GC,
   * а blob URL держит сам файл до выгрузки страницы.
   */
  const dispose = () => {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };

  /**
   * Слушатель ставится до действия, которое вызывает событие.
   *
   * @param event — ожидаемое событие
   * @param trigger — действие, после которого событие придёт
   * @returns промис, разрешённый событием
   */
  const perform = (event: string, trigger: () => void) => {
    const waiting = waitForEvent(video, event);

    trigger();

    return waiting;
  };

  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  try {
    await perform('loadeddata', () => {
      video.src = url;
    });

    if (!Number.isFinite(video.duration)) {
      await perform('seeked', () => {
        video.currentTime = SEEK_TO_END_SEC;
      });
    }
  } catch (error) {
    dispose();
    throw error;
  }

  const [width, height] = fit(video.videoWidth, video.videoHeight, maxSide);
  const plan = videoPlan(video.duration);

  return {
    width,
    height,
    plan,
    draw: async (index, ctx, w, h) => {
      const { position } = planItem(plan, index);

      await perform('seeked', () => {
        video.currentTime = position;
      });
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);
    },
    dispose,
  };
};
