import { useCallback, useEffect, useRef } from 'preact/hooks';

import type { ObjectUrls } from './useObjectUrls.types';

/**
 * Кэш object URL стикеров по id: сетки перерисовываются часто, а новый URL на каждый
 * рендер перезагружал бы картинку и держал в памяти блобы, которые уже никто не показывает.
 *
 * При закрытии пикера отзываются все URL: закрытый пикер остаётся смонтированным до конца
 * жизни страницы, и без этого в памяти копились бы блобы всех когда-либо показанных
 * стикеров. Представления при открытии перечитывают стикеры и получают новые URL, а пока
 * новый не загрузился, картинка показывает прежний кадр.
 *
 * @param isOpen — открыт ли пикер
 * @returns `urlOf` — URL блоба (один на id, пока пикер открыт), `dropUrl` — отзыв URL
 * удалённого стикера
 */
export const useObjectUrls = (isOpen: boolean): ObjectUrls => {
  const urlsRef = useRef(new Map<string, string>());

  const urlOf = useCallback((id: string, blob: Blob) => {
    const urls = urlsRef.current;
    let url = urls.get(id);

    if (!url) {
      url = URL.createObjectURL(blob);
      urls.set(id, url);
    }

    return url;
  }, []);

  const dropUrl = useCallback((id: string) => {
    const urls = urlsRef.current;
    const url = urls.get(id);

    if (url) URL.revokeObjectURL(url);
    urls.delete(id);
  }, []);

  const revokeAll = useCallback(() => {
    const urls = urlsRef.current;

    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear();
  }, []);

  useEffect(() => {
    if (!isOpen) revokeAll();
  }, [isOpen, revokeAll]);

  useEffect(() => {
    return revokeAll;
  }, [revokeAll]);

  return { urlOf, dropUrl };
};
