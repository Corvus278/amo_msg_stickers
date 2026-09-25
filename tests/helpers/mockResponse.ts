import type { MockResponseInit } from './mockResponse.types';

/**
 * Ответ fetch с заданным итоговым адресом: у настоящего `Response` поле `url` только для
 * чтения и задаётся самим fetch.
 *
 * @param body — тело ответа
 * @param init — статус, заголовки и итоговый адрес
 * @returns ответ для мока fetch
 */
export const mockResponse = (
  body: BodyInit | null,
  { url = '', status = 200, headers = {} }: MockResponseInit = {}
) => {
  const res = new Response(body, { status, headers });

  Object.defineProperty(res, 'url', { value: url });

  return res;
};
