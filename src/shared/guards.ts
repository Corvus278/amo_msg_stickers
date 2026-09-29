/**
 * Первый шаг любого гарда ответа API: дальше можно проверять поля через `in`.
 *
 * @param value — значение из JSON
 * @returns true, если это объект или массив, а не null и не примитив
 */
export const isObject = (value: unknown): value is object => {
  return !!value && typeof value === 'object';
};
