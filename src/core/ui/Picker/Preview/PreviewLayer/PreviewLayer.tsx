import { cva } from 'class-variance-authority';
import type { FunctionComponent as FC, TargetedFocusEvent } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';

import { t } from '../../../../i18n/translate';
import { CloseIcon } from '../CloseIcon/CloseIcon';
import { previewAttributes, shouldReturnFocus } from '../previewA11y/previewA11y';
import type { PreviewCloseReason } from '../previewA11y/previewA11y.types';
import { PreviewImage } from '../PreviewImage/PreviewImage';
import { playPreviewClose, playPreviewOpen } from '../previewMotion/previewMotion';
import type { PreviewState } from '../PreviewProvider.types';

import type { PreviewLayerProps } from './PreviewLayer.types';

/**
 * Слой на всю страницу: `absolute inset-0` от хоста слоя, а тот — `fixed` во всё окно.
 *
 * `pointer-events` задаются явно, а не наследуются: хост слоя курсор не принимает, и без
 * `pointer-events-auto` закреплённый слой клика бы не получил. Предпросмотр удержания курсор не
 * принимает: отпускание ловит провайдер на `window`, а оверлей под курсором не должен
 * перехватывать его у ячейки.
 */
const overlayVariants = cva('absolute inset-0', {
  variants: {
    mode: {
      hold: 'pointer-events-none',
      pinned: 'pointer-events-auto',
    },
  },
});

/**
 * Подложка — полупрозрачная и размытая, чтобы страница читалась под предпросмотром. Прозрачность
 * нарастает только у неё: картинка вылетает из ячейки сразу видимой (`previewMotion`), а не
 * проявляется вместе с подложкой.
 *
 * Появление — переход из `@starting-style`, уход — тот же переход в обратную сторону: слой
 * монтируется при открытии и снимается по концу ухода (`onLeaveEnd`). Переход и длительность — под `motion-safe:`, стартовое состояние —
 * без варианта, как у меню и экрана: при уменьшении движения подложка появляется сразу.
 */
const backdropVariants = cva(
  [
    'absolute inset-0',
    'bg-white-0/90 backdrop-blur-sm dark:bg-gray-10/90',
    'motion-safe:transition-opacity motion-safe:duration-base [@starting-style]:opacity-0',
  ],
  {
    variants: {
      /**
       * Уходящий слой гасит подложку тем же переходом прозрачности, которым она появилась.
       */
      isLeaving: {
        true: 'opacity-0',
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
  const { preview, onClose, onLeaveEnd } = props;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<PreviewState | null>(null);
  const mode = preview?.mode;
  const isPinned = mode === 'pinned';
  const isLeaving = preview?.isLeaving || false;
  const isShown = preview !== null && !isLeaving;

  /**
   * Состояние читают эффекты вылета и ухода ниже; эффекты идут в порядке объявления, поэтому к
   * их запуску ref уже свежий. Сами они зависят только от `isShown` и `isLeaving`, а не от
   * состояния: смена ячейки при удержании не должна запускать полёт заново.
   */
  useLayoutEffect(() => {
    latestRef.current = preview;
  }, [preview]);

  /**
   * Вылет запускается на открытие предпросмотра, а не на смену ячейки при удержании: слой
   * остаётся смонтированным между ячейками, и `isShown` меняется только при появлении, в том
   * числе при повторном открытии посреди ухода (очистка уже отменила его). Узлы уже в
   * документе — это эффект после коммита.
   */
  useLayoutEffect(() => {
    const source = latestRef.current?.source;
    const flight = flightRef.current;

    if (!isShown || !source || !flight) return;

    playPreviewOpen({ source, flight, emoji: emojiRef.current });
  }, [isShown]);

  /**
   * Уход: картинка возвращается в ячейку, по концу анимаций слой снимается. Без летящего узла
   * анимировать нечего — слой снимается сразу, иначе уходящее состояние осталось бы навсегда.
   * Повторное открытие меняет `isLeaving` и отменяет уход очисткой; запоздалый `onLeaveEnd`
   * старого состояния провайдер игнорирует.
   */
  useLayoutEffect(() => {
    const leaving = latestRef.current;
    const flight = flightRef.current;

    if (!isLeaving || !leaving) return;

    if (!flight) {
      onLeaveEnd(leaving);

      return;
    }

    const leave = playPreviewClose({
      source: leaving.source,
      flight,
      emoji: emojiRef.current,
    });

    const finish = async () => {
      await leave.finished;
      onLeaveEnd(leaving);
    };

    void finish();

    return () => {
      leave.cancel();
    };
  }, [isLeaving, onLeaveEnd]);

  /**
   * Фокус ставится после монтирования: меню, из которого открыт предпросмотр, к этому
   * моменту уже вернуло фокус на источник. `isLeaving` в зависимостях: закреплённый
   * предпросмотр, открытый заново посреди ухода, не меняет `isPinned`, но слой уже тот же и
   * кнопка «Закрыть предпросмотр» на месте — без этого фокус на неё не встал бы, и Escape не
   * закрыл бы диалог.
   */
  useEffect(() => {
    if (isPinned && !isLeaving) closeButtonRef.current?.focus({ preventScroll: true });
  }, [isPinned, isLeaving]);

  if (!preview) return null;

  const { target, source } = preview;

  /**
   * Уходящий предпросмотр объявляется и ведёт себя как предпросмотр удержания: курсор и
   * скринридер его уже не касаются, хотя слой ещё на экране.
   */
  const visibleMode = preview.isLeaving ? 'hold' : preview.mode;

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
      {...previewAttributes(visibleMode, target.name)}
      inert={preview.isLeaving}
      className={overlayVariants({ mode: visibleMode })}
    >
      <div
        aria-hidden="true"
        className={backdropVariants({ isLeaving: preview.isLeaving })}
      />

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
            <div ref={emojiRef} aria-hidden="true" className={EMOJI_CLASS}>
              {target.emoji}
            </div>
          )}

          <div ref={flightRef} className="size-full">
            <PreviewImage key={target.url} target={target} />
          </div>
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
