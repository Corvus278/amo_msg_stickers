/**
 * Цвета пузыря сообщения amo — те же токены, что в классах пузыря ленты, с ключом по пути в
 * `tailwind.config.ts`: входящий — `from-gray-110 to-white-0`, `dark:bg-black-60`; исходящий —
 * `from-flowerBlue-20 to-blue-120`, `dark:bg-beige-80`. Конфиг Tailwind в код ядра не
 * импортируется, поэтому значения дублируются, а совпадение с конфигом сверяет тест.
 */
export const BUBBLE_TOKENS = {
  'gray.110': '#f2f2f2',
  'white.0': '#ffffff',
  'black.60': '#3d3d3d',
  'flowerBlue.20': '#d8ecf7',
  'blue.120': '#e1f2ff',
  'beige.80': '#866647',
} as const;
