import type { Pack, RecentRec, SendItem, StickerRec } from './db.types';

export const CUSTOM_PACK_ID = 'custom';
const RECENT_LIMIT = 40;

const DB_NAME = 'amo-stickers';
const DB_VERSION = 1;

const STORE = {
  packs: 'packs',
  stickers: 'stickers',
  recent: 'recent',
} as const;

type StoreName = (typeof STORE)[keyof typeof STORE];

const PACK_ID_INDEX = 'packId';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      db.createObjectStore(STORE.packs, { keyPath: 'id' });
      const stickers = db.createObjectStore(STORE.stickers, { keyPath: 'id' });

      stickers.createIndex(PACK_ID_INDEX, 'packId');
      db.createObjectStore(STORE.recent, { keyPath: 'key' });
    };

    req.onsuccess = () => {
      return resolve(req.result);
    };

    req.onerror = () => {
      return reject(req.error);
    };
  });

  return dbPromise;
};

/**
 * IndexedDB отдаёт записи нетипизированными (`any`), поэтому тип результата задаёт
 * вызывающая сторона. Гарантия типа — только в том, что в хранилища пишут лишь
 * put-функции этого модуля.
 *
 * @param req — запрос IndexedDB
 * @returns результат запроса
 */
const promisify = <T>(req: IDBRequest): Promise<T> => {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      return resolve(req.result as T);
    };

    req.onerror = () => {
      return reject(req.error);
    };
  });
};

const store = async (name: StoreName, mode: IDBTransactionMode = 'readonly') => {
  const db = await openDb();

  return db.transaction(name, mode).objectStore(name);
};

/**
 * Случайная часть — 8 символов base36 после `0.`, временная метка отсекает
 * коллизии между сессиями.
 */
export const uid = () => {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const listPacks = async (): Promise<Pack[]> => {
  const packs = await promisify<Pack[]>((await store(STORE.packs)).getAll());

  return packs.sort((a, b) => {
    return a.createdAt - b.createdAt;
  });
};

export const getPack = async (id: string): Promise<Pack | undefined> => {
  return promisify<Pack | undefined>((await store(STORE.packs)).get(id));
};

export const putPack = async (pack: Pack) => {
  await promisify((await store(STORE.packs, 'readwrite')).put(pack));
};

export const ensureCustomPack = async (): Promise<Pack> => {
  const existing = await promisify<Pack | undefined>(
    (await store(STORE.packs)).get(CUSTOM_PACK_ID)
  );

  if (existing) return existing;
  const pack: Pack = {
    id: CUSTOM_PACK_ID,
    title: 'Мои стикеры',
    source: 'custom',
    /**
     * 0 — вкладка своих стикеров всегда первая среди наборов.
     */
    createdAt: 0,
  };

  await putPack(pack);

  return pack;
};

export const listStickers = async (packId: string): Promise<StickerRec[]> => {
  const index = (await store(STORE.stickers)).index(PACK_ID_INDEX);
  const stickers = await promisify<StickerRec[]>(index.getAll(packId));

  return stickers.sort((a, b) => {
    return a.createdAt - b.createdAt;
  });
};

export const deletePack = async (packId: string) => {
  const stickers = await listStickers(packId);
  const db = await openDb();
  const tx = db.transaction([STORE.packs, STORE.stickers], 'readwrite');

  tx.objectStore(STORE.packs).delete(packId);
  for (const { id } of stickers) tx.objectStore(STORE.stickers).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      return resolve();
    };

    tx.onerror = () => {
      return reject(tx.error);
    };
  });
};

export const getSticker = async (id: string): Promise<StickerRec | undefined> => {
  return promisify<StickerRec | undefined>((await store(STORE.stickers)).get(id));
};

export const putSticker = async (sticker: StickerRec) => {
  await promisify((await store(STORE.stickers, 'readwrite')).put(sticker));
};

export const deleteSticker = async (id: string) => {
  await promisify((await store(STORE.stickers, 'readwrite')).delete(id));
};

const recentKey = (item: SendItem): string => {
  switch (item.kind) {
    case 'local': {
      return `l:${item.stickerId}`;
    }

    case 'remote': {
      return `r:${item.gif.provider}:${item.gif.id}`;
    }

    default: {
      const unknownItem: never = item;

      throw new Error(`Unknown send item: ${JSON.stringify(unknownItem)}`);
    }
  }
};

export const pushRecent = async (item: SendItem) => {
  const recent = await store(STORE.recent, 'readwrite');
  const rec: RecentRec = { key: recentKey(item), ts: Date.now(), item };

  await promisify(recent.put(rec));
  const all = await promisify<RecentRec[]>(recent.getAll());

  if (all.length > RECENT_LIMIT) {
    const extra = all
      .sort((a, b) => {
        return b.ts - a.ts;
      })
      .slice(RECENT_LIMIT);
    const cleanup = await store(STORE.recent, 'readwrite');

    for (const { key } of extra) cleanup.delete(key);
  }
};

export const listRecent = async (): Promise<RecentRec[]> => {
  const all = await promisify<RecentRec[]>((await store(STORE.recent)).getAll());

  return all.sort((a, b) => {
    return b.ts - a.ts;
  });
};

export const deleteRecent = async (item: SendItem) => {
  await promisify((await store(STORE.recent, 'readwrite')).delete(recentKey(item)));
};
