import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC } from 'preact';
import { useState } from 'preact/hooks';

import type { PreviewImageProps } from './PreviewImage.types';

/**
 * Слои лежат друг на друге в одной области: `object-contain` вписывает картинку с
 * сохранением пропорций и увеличивает мелкую. `pointer-events-none` — картинка не начинает
 * перетаскивание и не перехватывает нажатие у оверлея. `alt` пуст: имя несёт диалог.
 */
const layerVariants = cva(
  'pointer-events-none absolute inset-0 size-full object-contain',
  {
    variants: {
      isHidden: {
        true: 'opacity-0',
      },
    },
  }
);

/**
 * Картинка предпросмотра. У GIF два слоя: облегчённое превью из ленты стоит, пока версия для
 * отправки не загрузилась, по её `load` превью скрывается, чтобы прозрачные места не
 * просвечивали. При ошибке загрузки версия остаётся скрытой, а превью — на месте.
 *
 * Состояние загрузки принадлежит адресу: оверлей монтирует компонент с `key` от `url`.
 */
export const PreviewImage: FC<PreviewImageProps> = (props) => {
  const { target } = props;
  const { url, previewUrl } = target;
  const [isLoaded, setLoaded] = useState(false);
  const hasPreviewLayer = Boolean(previewUrl);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  return (
    <div className="relative size-full">
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          draggable={false}
          className={layerVariants({ isHidden: isLoaded })}
        />
      )}

      <img
        src={url}
        alt=""
        draggable={false}
        className={layerVariants({ isHidden: hasPreviewLayer && !isLoaded })}
        onLoad={handleImageLoad}
      />
    </div>
  );
};
