import { toStickerGif } from '../convert';
import type { SourceKind } from '../convert.types';
import { deletePack, getPack, putPack, putSticker } from '../db';
import type { Pack } from '../db.types';
import type { Host } from '../host.types';
import { t } from '../i18n/translate';
import { BYTES_IN_MB } from '../net';

import {
  type ImportProgress,
  isTgFile,
  isTgResponse,
  isTgSticker,
  isTgStickerSet,
  SET_NAME_RE,
  type TgSticker,
} from './telegram.types';

/**
 * Импорт пака через Telegram Bot API.
 * Нужен токен любого бота (@BotFather) — getStickerSet работает для публичных паков.
 */

const TG_API = 'https://api.telegram.org';

/**
 * Префикс id пака и стикера: отделяет импорт из Telegram от своих стикеров в одной базе.
 */
const TG_ID_PREFIX = 'tg:';

/**
 * У Telegram статичные стикеры до 512 КБ, `.tgs` до 64 КБ, видео до 256 КБ; лимит — с
 * запасом на изменение этих правил.
 */
const MAX_STICKER_FILE_BYTES = 5 * BYTES_IN_MB;

/**
 * Ошибка создаётся на каждый отказ, а не хранится готовой: текст берётся на языке интерфейса в момент
 * отказа, а модуль вычисляется раньше, чем `start()` выставит язык.
 *
 * @returns ошибка ответа не по форме Bot API
 */
const badResponse = () => {
  return new Error(t('error.source.badResponse', { source: 'Telegram' }));
};

const SET_LINK_RE = /(?:t\.me|telegram\.me)\/(?:addstickers|addemoji)\/([A-Za-z0-9_]+)/;

export const parseSetName = (input: string): string | null => {
  const trimmed = input.trim();
  const [, name] = trimmed.match(SET_LINK_RE) || [];

  if (name) return name;

  return SET_NAME_RE.test(trimmed) ? trimmed : null;
};

/**
 * Вызов метода Bot API. Возвращает `result` без проверки формы: её проверяет гард метода.
 *
 * @param host — окружение
 * @param token — токен бота
 * @param method — метод Bot API
 * @param params — параметры запроса
 * @returns `result` ответа
 */
const call = async (
  host: Host,
  token: string,
  method: string,
  params: Record<string, string>
) => {
  const response = await host.fetchJson(
    `${TG_API}/bot${token}/${method}?${new URLSearchParams(params)}`
  );

  if (!isTgResponse(response)) throw badResponse();
  const { ok, result, description } = response;

  if (!ok) throw new Error(description || t('error.telegram.methodFailed', { method }));

  return result;
};

const toSourceKind = ({
  is_animated: isAnimated,
  is_video: isVideo,
}: TgSticker): SourceKind => {
  if (isAnimated) return 'tgs';

  return isVideo ? 'video' : 'image';
};

/**
 * Telegram отдаёт файлы без осмысленного MIME, а декодеру картинок и видео тип нужен.
 * TGS остаётся как есть: его распознаёт Lottie, а не браузер.
 */
const withMimeType = (raw: Blob, kind: SourceKind): Blob => {
  switch (kind) {
    case 'image': {
      return new Blob([raw], { type: 'image/webp' });
    }

    case 'video': {
      return new Blob([raw], { type: 'video/webm' });
    }

    case 'tgs': {
      return raw;
    }

    default: {
      throw new Error(`Unknown source kind: ${String(kind)}`);
    }
  }
};

export const importTelegramSet = async (
  host: Host,
  token: string,
  input: string,
  onProgress: (p: ImportProgress) => void
): Promise<Pack> => {
  const name = parseSetName(input);

  if (!name) throw new Error(t('error.telegram.badLink'));
  if (!token) throw new Error(t('error.telegram.noToken'));

  const set = await call(host, token, 'getStickerSet', { name });

  if (!isTgStickerSet(set)) throw badResponse();
  const { name: setName, title, stickers } = set;

  const pack: Pack = {
    id: `${TG_ID_PREFIX}${setName}`,
    title,
    source: 'telegram',
    sourceRef: setName,
    createdAt: Date.now(),
  };
  const previous = await getPack(pack.id);

  await putPack(pack);

  const total = stickers.length;

  onProgress({ done: 0, total, title });

  let done = 0;

  /**
   * Причина первого отказа: если не импортируется ни один стикер, пользователь видит её, а не общее
   * «нет пригодных стикеров» — лимит размера или сеть подсказывают, что делать. Отказы стикеров одного
   * пака обычно одной природы, и одной причины достаточно.
   */
  let firstError: unknown;

  for (const [index, sticker] of stickers.entries()) {
    try {
      if (!isTgSticker(sticker)) throw badResponse();
      const { file_id: fileId, file_unique_id: fileUniqueId, emoji } = sticker;
      const file = await call(host, token, 'getFile', { file_id: fileId });

      if (!isTgFile(file)) throw new Error(t('error.telegram.badFilePath'));
      const { file_path: filePath } = file;
      const raw = await host.fetchBlob(
        `${TG_API}/file/bot${token}/${filePath}`,
        MAX_STICKER_FILE_BYTES
      );
      const kind = toSourceKind(sticker);
      const gif = await toStickerGif(withMimeType(raw, kind), kind);
      const id = `${TG_ID_PREFIX}${fileUniqueId}`;

      await putSticker({
        id,
        packId: pack.id,
        blob: gif.blob,
        width: gif.width,
        height: gif.height,
        emoji,
        createdAt: pack.createdAt + index,
      });

      if (!pack.coverId) {
        pack.coverId = id;
        await putPack(pack);
      }
    } catch (e) {
      console.warn('[amo-stickers] sticker import failed', index, e);
      firstError ||= e;
    }

    done++;
    onProgress({ done, total, title });
  }

  /**
   * Ни одного стикера не импортировано — это ошибка, а не пустая вкладка. Пак, импортированный
   * раньше, не сносим: неудачный повтор (например, без сети) вернёт его запись как была. Общий текст
   * остаётся пустому паку, где отказов не было.
   */
  if (!pack.coverId) {
    await (previous ? putPack(previous) : deletePack(pack.id));
    throw firstError || new Error(t('error.telegram.noStickers'));
  }

  return pack;
};
