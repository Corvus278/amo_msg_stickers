import { vi } from 'vitest';

/**
 * `fetch`, который отвечает по адресу из очереди ответов этого адреса и пишет вызовы. Запрос без ответа в очереди —
 * ошибка: лишний или неожиданный вызов виден в тесте.
 *
 * @param routes — очереди ответов по адресам
 * @returns мок `fetch`
 */
export const routedFetch = (routes: Record<string, Response[]>) => {
  return vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const response = routes[url]?.shift();

    if (!response) {
      throw new Error(`Неожиданный запрос ${url}`);
    }

    return response;
  });
};
