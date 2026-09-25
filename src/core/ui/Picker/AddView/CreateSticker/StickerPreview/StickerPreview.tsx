import type { FunctionComponent as FC } from 'preact';

import type { StickerPreviewProps } from './StickerPreview.types';

/**
 * Шахматка — из цвета фона поля ввода и прозрачных клеток: сквозь прозрачные пиксели
 * стикера видно клетку, а не сплошной фон панели.
 */
const BOARD_CLASS = [
  'flex justify-center rounded-lgx p-1.5 [background-size:16px_16px]',
  'bg-[repeating-conic-gradient(theme(colors.cadetGray.30/12%)_0_25%,transparent_0_50%)]',
  'dark:bg-[repeating-conic-gradient(theme(colors.white.0/6%)_0_25%,transparent_0_50%)]',
].join(' ');

export const StickerPreview: FC<StickerPreviewProps> = (props) => {
  const { url } = props;

  return (
    <div className={BOARD_CLASS}>
      <img src={url} alt="" className="max-h-40 max-w-40" />
    </div>
  );
};
