import type { FunctionComponent as FC } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

import { isMotionReduced } from '../scrollMotion/scrollMotion';
import { usePickerView } from '../usePickerView/usePickerView';

import { BackIcon } from './BackIcon/BackIcon';
import type { ScreenProps } from './Screen.types';

/**
 * `z-10` — над содержимым режима: позиционированные элементы ленты идут в DOM раньше
 * экрана, но с `z-index` перекрыли бы его.
 */
const SCREEN_CLASS = 'absolute inset-0 z-10 flex flex-col bg-white-0 dark:bg-gray-10';

/**
 * Появление экрана: из прозрачности со сдвигом вправо на `translate-x-2` (0,5rem). Уход — та же
 * анимация в обратную сторону.
 */
const SCREEN_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'translateX(0.5rem)' },
  { opacity: 1, transform: 'none' },
];

/**
 * Длительность появления и кривая — токены `duration-lg` и перехода по умолчанию из
 * `tailwind.config.ts`.
 */
const SCREEN_ENTER_MS = 200;
const SCREEN_EASING = 'ease-in-out';

/**
 * Уход короче появления, и токена под него нет: режим под экраном `inert`, пока экран не
 * закрыт, и ввод в ленту возвращается только по концу ухода — длинный уход съел бы клик
 * пользователя, который сразу после «Назад» тянется к ленте.
 */
const SCREEN_LEAVE_MS = 100;

const BACK_BUTTON_CLASS = [
  'flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-transparent py-0 pl-0.5 pr-2',
  'font-primary text-xsm leading-[normal] text-cadetGray-30',
  'hover:bg-cadetGray-30/[.14] dark:text-gray-70 dark:hover:bg-white-0/[.07]',
].join(' ');

/**
 * Экран поверх режима. Режим под ним остаётся в раскладке, поэтому прокрутка ленты и
 * запрос поиска переживают «Назад» как есть, без восстановления.
 *
 * Появление и уход — анимации скрипта (`element.animate()`), а не CSS-переход из
 * `@starting-style`: закрытая панель скрыта `display: none`, и при повторном открытии попапа
 * переход из `@starting-style` проиграл бы появление смонтированного экрана заново. Анимация
 * скрипта проигрывается один раз — при монтировании экрана, то есть при переходе на него внутри
 * открытого попапа.
 *
 * «Назад» проигрывает появление в обратную сторону — с того места, где оно сейчас, за
 * `SCREEN_LEAVE_MS` от полностью показанного экрана — и закрывает экран по концу анимации;
 * повторное «Назад» во время ухода ничего не делает. Экран, снятый во время ухода другим путём
 * (кнопка футера, смена экрана), уже закрыт или заменён, и конец его анимации экран не закрывает.
 * При уменьшении движения экран появляется и закрывается сразу.
 *
 * `display: none` закрытой панели анимацию скрипта не отменяет: уход, начатый перед закрытием
 * попапа, доигрывается, и экран закрывается по его концу. Отмена анимации тоже закрывает экран —
 * это защита, а не рабочий путь.
 */
export const Screen: FC<ScreenProps> = (props) => {
  const { children } = props;
  const { closeScreen } = usePickerView();
  const screenRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Animation | null>(null);
  const isLeavingRef = useRef(false);
  const isMountedRef = useRef(true);

  useLayoutEffect(() => {
    const element = screenRef.current;

    isMountedRef.current = true;

    /**
     * `fill: 'backwards'` держит начало анимации до её старта и после ухода — проигранной назад
     * до начала: экран не мелькает видимым между концом ухода и размонтированием. После
     * появления анимация на экране не держится.
     */
    if (element) {
      motionRef.current = element.animate(SCREEN_KEYFRAMES, {
        duration: isMotionReduced() ? 0 : SCREEN_ENTER_MS,
        easing: SCREEN_EASING,
        fill: 'backwards',
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const leave = async (motion: Animation) => {
    /**
     * Скорость ставится до `reverse()`: он обращает её знак и играет с текущего места, поэтому
     * уход с середины появления короче и `SCREEN_LEAVE_MS`.
     */
    motion.playbackRate = SCREEN_ENTER_MS / SCREEN_LEAVE_MS;
    motion.reverse();

    try {
      await motion.finished;
    } catch {
      /**
       * Отменённая анимация — тоже конец ухода: экран закрывается. `display: none` панели
       * анимацию не отменяет, ветка — защита от отмены браузером.
       */
    }

    if (isMountedRef.current) closeScreen();
  };

  const handleBackClick = () => {
    const { current: motion } = motionRef;

    if (isLeavingRef.current) return;

    isLeavingRef.current = true;

    if (!motion || isMotionReduced()) {
      closeScreen();

      return;
    }

    void leave(motion);
  };

  return (
    <div ref={screenRef} className={SCREEN_CLASS}>
      <div className="flex shrink-0 px-1.5 pt-1.5">
        <button type="button" className={BACK_BUTTON_CLASS} onClick={handleBackClick}>
          <BackIcon />
          Назад
        </button>
      </div>

      {children}
    </div>
  );
};
