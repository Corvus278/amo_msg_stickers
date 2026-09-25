import { toStickerGif } from '../convert';
import type { SourceKind } from '../convert.types';
import { putPack, putSticker } from '../db';
import type { Pack } from '../db.types';
import type { Host } from '../host.types';

import type {
  ImportProgress,
  TgFile,
  TgResponse,
  TgSticker,
  TgStickerSet,
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

const SET_LINK_RE = /(?:t\.me|telegram\.me)\/(?:addstickers|addemoji)\/([A-Za-z0-9_]+)/;
const SET_NAME_RE = /^[A-Za-z0-9_]+$/;

export const parseSetName = (input: string): string | null => {
  const trimmed = input.trim();
  const [, name] = trimmed.match(SET_LINK_RE) || [];

  if (name) return name;

  return SET_NAME_RE.test(trimmed) ? trimmed : null;
};

const call = async <T>(
  host: Host,
  token: string,
  method: string,
  params: Record<string, string>
): Promise<T> => {
  const { ok, result, description } = await host.fetchJson<TgResponse<T>>(
    `${TG_API}/bot${token}/${method}?${new URLSearchParams(params)}`
  );

  if (!ok) throw new Error(description || `Telegram: ${method} failed`);

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

  if (!name) throw new Error('Не понял ссылку. Нужна вида t.me/addstickers/Name');
  if (!token) throw new Error('Укажите токен бота в настройках');

  const {
    name: setName,
    title,
    stickers,
  } = await call<TgStickerSet>(host, token, 'getStickerSet', { name });

  const pack: Pack = {
    id: `${TG_ID_PREFIX}${setName}`,
    title,
    source: 'telegram',
    sourceRef: setName,
    createdAt: Date.now(),
  };

  await putPack(pack);

  const total = stickers.length;

  onProgress({ done: 0, total, title });

  let done = 0;

  for (const [index, sticker] of stickers.entries()) {
    const { file_id: fileId, file_unique_id: fileUniqueId, emoji } = sticker;

    try {
      const { file_path: filePath } = await call<TgFile>(host, token, 'getFile', {
        file_id: fileId,
      });
      const raw = await host.fetchBlob(`${TG_API}/file/bot${token}/${filePath}`);
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
      console.warn('[amo-stickers] sticker import failed', fileId, e);
    }

    done++;
    onProgress({ done, total, title });
  }

  return pack;
};
