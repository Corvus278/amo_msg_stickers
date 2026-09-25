import { useCallback, useEffect, useState } from 'preact/hooks';

import type { ConfirmPress } from './useConfirmPress.types';

const CONFIRM_RESET_MS = 2500;

/**
 * Подтверждение повторным нажатием вместо `confirm()`: модальные диалоги браузера
 * блокируют страницу amo. Без повторного нажатия за 2,5 с подтверждение снимается само;
 * таймер живёт в эффекте и отменяется при размонтировании кнопки.
 *
 * @returns взведено ли подтверждение и нажатие
 */
export const useConfirmPress = (): ConfirmPress => {
  const [isArmed, setIsArmed] = useState(false);

  useEffect(() => {
    if (!isArmed) return;

    const timer = setTimeout(() => {
      setIsArmed(false);
    }, CONFIRM_RESET_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isArmed]);

  const press = useCallback(() => {
    if (isArmed) return true;

    setIsArmed(true);

    return false;
  }, [isArmed]);

  return { isArmed, press };
};
