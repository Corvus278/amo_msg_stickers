import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC, TargetedFocusEvent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { t } from '../../../../i18n/translate';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import { previewAttributes, shouldReturnFocus } from '../previewA11y/previewA11y';
import type { PreviewCloseReason } from '../previewA11y/previewA11y.types';
import { PreviewImage } from '../PreviewImage/PreviewImage';

import type { PreviewLayerProps } from './PreviewLayer.types';

/**
 * Слой на всю страницу: `absolute inset-0` от хоста слоя, а тот — `fixed` во всё окно. Подложка
 * полупрозрачная и размытая, чтобы страница читалась под предпросмотром.
 *
 * `pointer-events` задаются явно, а не наследуются: хост слоя курсор не принимает, и без
 * `pointer-events-auto` закреплённый слой клика бы не получил.
 *
 * Появление — переход из `@starting-style`: оверлей монтируется при открытии, закрытие его
 * размонтирует без ухода. Переход и длительность — под `motion-safe:`, стартовое состояние —
 * без варианта, как у меню и экрана: при уменьшении движения оверлей появляется сразу.
 *
 * Предпросмотр удержания не принимает курсор: отпускание ловит провайдер на `window`, а
 * оверлей под курсором не должен перехватывать его у ячейки.
 */
const overlayVariants = cva(
  [
    'absolute inset-0',
    'bg-white-0/90 backdrop-blur-sm dark:bg-gray-10/90',
    'motion-safe:transition-opacity motion-safe:duration-base [@starting-style]:opacity-0',
  ],
  {
    variants: {
      mode: {
        hold: 'pointer-events-none',
        pinned: 'pointer-events-auto',
      },
    },
  }
);

/**
 * Слой содержимого без роли: обработчики клавиши, клика и ухода фокуса висят на нём, а не на
 * корне с ролью диалога. `tabIndex={-1}` у закреплённого — нажатие на подложку или картинку
 * ставит фокус на сам слой, а не снимает его в `body`, и `focusout` не закрывает оверлей
 * раньше клика, который его закроет. Отступ в 48 px оставляет воздух и место эмодзи над
 * картинкой, а картинка стоит по центру в квадрате не больше 400 px (`CANVAS_CLASS`).
 */
const CONTENT_CLASS =
  'absolute inset-0 flex items-center justify-center p-12 outline-none';

/**
 * Квадрат картинки: крупнее 400 px стикер рассматривать незачем. `min(100%, 25rem)` — это
 * 400 px, а в окне меньше — само окно. `relative`: эмодзи стоит над квадратом и его не
 * сдвигает.
 */
const CANVAS_CLASS = 'relative size-[min(100%,25rem)]';

/**
 * Эмодзи над картинкой: `bottom-full` ставит его над верхней гранью квадрата, отступ в 48 px у
 * содержимого оставляет под него место даже в тесном окне.
 */
const EMOJI_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-full mb-2 select-none text-center text-[36px] leading-none';

const CLOSE_BUTTON_CLASS = [
  'absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-full',
  'bg-transparent p-0 text-cadetGray-30 dark:text-gray-70',
  'hover:bg-cadetGray-30/[.14] dark:hover:bg-white-0/[.07]',
  'motion-safe:transition-colors motion-safe:duration-base',
].join(' ');

/**
 * Слой предпросмотра: один на панель, состояние получает пропсами — он рисуется в своём
 * shadow root вне дерева панели и контекста `PreviewProvider` не видит. Закреплённый — диалог
 * с фокусом на кнопке «Закрыть предпросмотр»: Escape закрывает только его (нажатие не
 * всплывает на страницу), клик закрывает и не доходит до страницы под ним, уход фокуса
 * наружу закрывает без возврата фокуса. Удержание фокус не трогает.
 */
export const PreviewLayer: FC<PreviewLayerProps> = (props) => {
  const { preview, onClose } = props;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mode = preview?.mode;
  const isPinned = mode === 'pinned';

  /**
   * Фокус ставится после монтирования: меню, из которого открыт предпросмотр, к этому
   * моменту уже вернуло фокус на источник.
   */
  useEffect(() => {
    if (isPinned) closeButtonRef.current?.focus({ preventScroll: true });
  }, [isPinned]);

  if (!preview) return null;

  const { target, source } = preview;

  const closeWith = (reason: PreviewCloseReason) => {
    if (shouldReturnFocus(reason, source)) source.focus({ preventScroll: true });

    onClose();
  };

  const handleContentKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key !== 'Escape') return;

    event.preventDefault();
    closeWith('escape');
  };

  const handleContentClick = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    closeWith('click');
  };

  const handleContentFocusOut = (event: TargetedFocusEvent<HTMLDivElement>) => {
    const { relatedTarget, currentTarget } = event;

    if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) return;

    closeWith('focusout');
  };

  return (
    <div
      {...previewAttributes(preview.mode, target.name)}
      className={overlayVariants({ mode: preview.mode })}
    >
      <div
        role="presentation"
        tabIndex={isPinned ? -1 : undefined}
        className={CONTENT_CLASS}
        onKeyDown={handleContentKeyDown}
        onClick={handleContentClick}
        onFocusOut={handleContentFocusOut}
      >
        <div className={CANVAS_CLASS}>
          {target.emoji && (
            <div aria-hidden="true" className={EMOJI_CLASS}>
              {target.emoji}
            </div>
          )}

          <PreviewImage key={target.url} target={target} />
        </div>

        {isPinned && (
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={t('preview.close')}
            className={CLOSE_BUTTON_CLASS}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
};
