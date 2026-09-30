import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC, TargetedFocusEvent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { t } from '../../../../i18n/translate';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import { previewAttributes, shouldReturnFocus } from '../previewA11y/previewA11y';
import type { PreviewCloseReason } from '../previewA11y/previewA11y.types';
import { PreviewImage } from '../PreviewImage/PreviewImage';
import { usePreview } from '../usePreview';

/**
 * Слой поверх области режима: `z-10` — над экраном и позиционированными рядами ленты (они в
 * DOM раньше), под строкой статуса (`z-20`) и вне футера. Подложка полупрозрачная, чтобы
 * лента читалась под предпросмотром.
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
    'absolute inset-0 z-10',
    'bg-white-0/90 dark:bg-gray-10/90',
    'motion-safe:transition-opacity motion-safe:duration-base [@starting-style]:opacity-0',
  ],
  {
    variants: {
      mode: {
        hold: 'pointer-events-none',
        pinned: '',
      },
    },
  }
);

/**
 * Слой содержимого без роли: обработчики клавиши, клика и ухода фокуса висят на нём, а не на
 * корне с ролью диалога. `tabIndex={-1}` у закреплённого — нажатие на подложку или картинку
 * ставит фокус на сам слой, а не снимает его в `body`, и `focusout` не закрывает оверлей
 * раньше клика, который его закроет. Отступ в 16 px оставляет картинке воздух.
 */
const CONTENT_CLASS = 'absolute inset-0 p-4 outline-none';

const CLOSE_BUTTON_CLASS = [
  'absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full',
  'bg-transparent p-0 text-cadetGray-30 dark:text-gray-70',
  'hover:bg-cadetGray-30/[.14] dark:hover:bg-white-0/[.07]',
  'motion-safe:transition-colors motion-safe:duration-base',
].join(' ');

/**
 * Оверлей предпросмотра: один на панель, читает состояние из `PreviewProvider`. Закреплённый
 * — диалог с фокусом на кнопке «Закрыть предпросмотр»: Escape закрывает только его (нажатие не
 * всплывает к панели, иначе закрылся бы попап), клик закрывает и не доходит до ленты под ним,
 * уход фокуса наружу закрывает без возврата фокуса. Удержание фокус не трогает.
 */
export const PreviewOverlay: FC = () => {
  const { preview, close } = usePreview();
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

    close();
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
        <PreviewImage key={target.url} target={target} />

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
