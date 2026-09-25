import type { SourceKind } from './convert.types';
import type { FrameSource } from './frameSource.types';
import { openImageSource } from './frameSourceImage';
import { openTgsSource } from './frameSourceTgs';
import { openVideoSource } from './frameSourceVideo';

/**
 * Открывает источник кадров нужного вида. Размер источника вписан в `maxSide`, план уже
 * обрезан до 4 с и 100 кадров. Вызывающий обязан позвать `dispose` при любом исходе;
 * если открытие отклонилось, освобождать нечего.
 *
 * @param blob — исходный файл
 * @param kind — вид источника
 * @param maxSide — предел большей стороны
 * @returns открытый источник кадров
 */
export const openFrameSource = (
  blob: Blob,
  kind: SourceKind,
  maxSide: number
): Promise<FrameSource> => {
  switch (kind) {
    case 'video': {
      return openVideoSource(blob, maxSide);
    }

    case 'tgs': {
      return openTgsSource(blob, maxSide);
    }

    case 'image': {
      return openImageSource(blob, maxSide);
    }

    default: {
      const unknownKind: never = kind;

      throw new Error(`Unknown source kind: ${String(unknownKind)}`);
    }
  }
};
