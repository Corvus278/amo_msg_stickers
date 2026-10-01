/**
 * Записывает текст в буфер обмена. Вызывать из обработчика действия пользователя: без жеста
 * браузер запись отклонит. Без Clipboard API (небезопасный контекст) и при отказе браузера
 * исключения не будет — результат сообщает, удалось ли.
 *
 * Запасного пути через скрытое поле и `execCommand` нет: он менял бы DOM страницы amo ради
 * редкого отказа, а отказ виден в статусе.
 *
 * @param text — что записать
 * @returns `true` — текст в буфере; `false` — записать не удалось
 */
export const copyText = async (text: string): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
};
