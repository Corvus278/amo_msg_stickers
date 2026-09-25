import type { AnimationItem } from 'lottie-web';
import lottie from 'lottie-web/build/player/lottie_light_canvas';

import type { FramePlanItem, FrameSource } from './frameSource.types';
import {
  ANIMATION_FPS,
  EVENT_TIMEOUT_MS,
  fit,
  MAX_DURATION_SEC,
  MAX_FRAMES,
  planItem,
} from './frameSourceCommon';
import { readTgs } from './tgs';

/**
 * Частота Lottie, если файл её не указал.
 */
const DEFAULT_LOTTIE_FPS = 60;

/**
 * План кадров `.tgs`: номера исходных кадров с шагом `sourceFps / fps`, не дальше 4 с
 * исходного времени и не больше 100 кадров. При исходных fps ниже целевых шаг — один
 * кадр, поэтому задержка берётся от реального шага, а не от целевых fps. Номер кадра —
 * `index * step`, а не накопление шага: сумма дробей на границе добавила бы кадр за концом.
 *
 * @param totalFrames — число кадров анимации
 * @param sourceFps — исходная частота файла
 * @param fps — целевая частота захвата
 * @returns план кадров с номерами исходных кадров
 */
export const tgsPlan = (totalFrames: number, sourceFps: number, fps = ANIMATION_FPS) => {
  const total = Math.min(totalFrames, sourceFps * MAX_DURATION_SEC);
  const step = Math.max(1, sourceFps / fps);
  const delayMs = (step / sourceFps) * 1000;
  const plan: FramePlanItem[] = [];

  for (let index = 0; index < MAX_FRAMES && index * step < total; index++) {
    plan.push({ position: index * step, delayMs });
  }

  return plan;
};

/**
 * Ждёт загрузки Lottie-анимации, но не дольше таймаута: по его истечении
 * раскадровка идёт с тем, что успело загрузиться.
 *
 * @param anim — анимация lottie-web
 * @returns промис, разрешённый загрузкой или таймаутом
 */
const lottieLoaded = (anim: AnimationItem) => {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, EVENT_TIMEOUT_MS);
    const removeListener = anim.addEventListener('DOMLoaded', () => {
      clearTimeout(timer);
      removeListener();
      resolve();
    });
  });
};

/**
 * Открывает `.tgs` как источник кадров. Анимация рендерится один раз на свой холст в
 * размере источника, а в целевой холст кадр переносится `drawImage`: любой размер прохода
 * обходится одним экземпляром lottie. Битый файл отклоняется до запуска рендера.
 *
 * @param blob — файл `.tgs`
 * @param maxSide — предел большей стороны
 * @returns источник кадров `.tgs`
 */
export const openTgsSource = async (
  blob: Blob,
  maxSide: number
): Promise<FrameSource> => {
  const json = await readTgs(blob);
  const [width, height] = fit(json.w, json.h, maxSide);
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

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
      context: canvas.getContext('2d'),
      clearCanvas: true,
      dpr: 1,
      preserveAspectRatio: 'xMidYMid meet',
    },
  } as Parameters<typeof lottie.loadAnimation>[0]);

  try {
    if (!anim.isLoaded) await lottieLoaded(anim);
  } catch (error) {
    anim.destroy();
    throw error;
  }

  const plan = tgsPlan(anim.totalFrames, json.fr || DEFAULT_LOTTIE_FPS);

  return {
    width,
    height,
    plan,
    draw: async (index, ctx, w, h) => {
      anim.goToAndStop(planItem(plan, index).position, true);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h);
    },
    dispose: () => {
      anim.destroy();
    },
  };
};
