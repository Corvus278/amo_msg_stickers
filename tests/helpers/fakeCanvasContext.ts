import { vi } from 'vitest';

/**
 * Подставной контекст холста: ровно то, что источник кадров зовёт в `draw`.
 *
 * @returns контекст со шпионами `clearRect` и `drawImage`
 */
export const fakeCanvasContext = () => {
  return { clearRect: vi.fn(), drawImage: vi.fn() };
};
