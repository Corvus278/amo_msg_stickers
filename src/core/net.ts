/**
 * Сетевая политика ядра: куда разрешено ходить и сколько байт читать. Её применяют оба
 * окружения — service worker расширения и userscript, — чтобы вести себя одинаково.
 */

export const BYTES_IN_MB = 1024 * 1024;

const ALLOWED_PROTOCOL = 'https:';

/**
 * Совпадает с `host_permissions` в manifest: домен и все его поддомены. Ссылки из ответов
 * API на другие хосты не скачиваем — иначе IP и Referer пользователя amo утекают туда,
 * куда укажет ответ.
 */
const ALLOWED_DOMAINS = ['api.telegram.org', 'giphy.com', 'klipy.com'];

/**
 * Сколько символов тела ответа попадает в текст ошибки — достаточно, чтобы понять причину,
 * и не раздувает сообщение HTML-страницей ошибки.
 */
const ERROR_BODY_PREVIEW = 200;

const NOT_ALLOWED = 'Адрес вне списка разрешённых';

/**
 * Хост сравнивается после разбора URL, а не регуляркой по строке: так
 * `giphy.com.evil.example`, `evilgiphy.com` и `https://api.telegram.org@evil.example/`
 * не проходят.
 *
 * @param url — проверяемый адрес
 * @returns true, если по адресу можно ходить
 */
export const isAllowedUrl = (url: string) => {
  if (!URL.canParse(url)) return false;
  const { protocol, hostname } = new URL(url);

  return (
    protocol === ALLOWED_PROTOCOL &&
    ALLOWED_DOMAINS.some((domain) => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    })
  );
};

/**
 * Адреса в тексте ошибки нет: в пути запросов к Telegram лежит токен бота, а текст ошибки
 * показывается в попапе и пишется в консоль.
 *
 * @param url — проверяемый адрес
 */
const assertAllowedUrl = (url: string) => {
  if (!isAllowedUrl(url)) throw new Error(NOT_ALLOWED);
};

const tooBigError = (maxBytes: number) => {
  return new Error(`Файл больше ${Math.round((maxBytes / BYTES_IN_MB) * 10) / 10} МБ`);
};

/**
 * Читает поток целиком, но не больше `maxBytes`: при превышении источник отменяется, и
 * остаток не скачивается и не распаковывается.
 *
 * @param stream — поток байтов
 * @param maxBytes — предел размера
 * @returns все байты потока
 */
export const readLimited = async (
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
) => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;
    total += value.byteLength;

    if (total > maxBytes) {
      await reader.cancel();
      throw tooBigError(maxBytes);
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
};

/**
 * Тело ответа не больше `maxBytes`. `Content-Length` отсекает заведомо большой ответ до
 * чтения, но сервер может его не прислать или соврать — поэтому поток читается с лимитом
 * всегда.
 *
 * @param res — ответ fetch
 * @param maxBytes — предел размера тела
 * @returns байты тела
 */
export const readResponseLimited = async (res: Response, maxBytes: number) => {
  if (Number(res.headers.get('content-length')) > maxBytes) {
    await res.body?.cancel();
    throw tooBigError(maxBytes);
  }

  if (!res.body) return new Uint8Array(0);

  return readLimited(res.body, maxBytes);
};

/**
 * fetch в рамках сетевой политики. Адрес вне политики — исключение без обращения к сети;
 * редирект fetch проходит сам, поэтому политика проверяется и на итоговом адресе. Не-2xx
 * ответ — исключение с HTTP-статусом и началом тела.
 *
 * @param url — адрес запроса
 * @returns успешный ответ
 */
export const fetchChecked = async (url: string) => {
  assertAllowedUrl(url);
  const res = await fetch(url);

  if (!isAllowedUrl(res.url || url)) {
    await res.body?.cancel();
    throw new Error(NOT_ALLOWED);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => {
      return '';
    });

    throw new Error(`HTTP ${res.status} ${body.slice(0, ERROR_BODY_PREVIEW)}`);
  }

  return res;
};
