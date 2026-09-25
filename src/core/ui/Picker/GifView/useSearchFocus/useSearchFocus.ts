import { useEffect, useRef } from 'preact/hooks';

/**
 * Фокус в поле поиска на каждое открытие пикера и на переход во вкладку: GIF ищут
 * сразу, без лишнего клика по полю.
 *
 * @param isOpen — открыт ли пикер
 * @returns ссылка для поля поиска
 */
export const useSearchFocus = (isOpen: boolean) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return inputRef;
};
