import type { FunctionComponent as FC } from 'preact';

/**
 * Крутится одна четверть кольца в акцентном цвете панели. Под кольцом — круг цвета панели:
 * без него дуга терялась бы на пёстром кадре GIF.
 */
const SPINNER_CLASS = [
  'pointer-events-none absolute inset-0 m-auto size-7 animate-spin rounded-full border-[3px]',
  'border-cadetGray-30/[.28] border-t-blue-50 bg-white-0 shadow-[0_1px_3px] shadow-black-0/20',
  'dark:border-white-0/10 dark:border-t-beige-70 dark:bg-gray-10',
].join(' ');

/**
 * Индикатор отправки поверх ячейки. Для скринридера занятость объявляет `aria-busy` кнопки
 * ячейки, сам индикатор скрыт.
 */
export const CellSpinner: FC = () => {
  return <span aria-hidden="true" className={SPINNER_CLASS} />;
};
