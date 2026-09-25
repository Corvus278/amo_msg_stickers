import { useCallback, useEffect, useRef } from 'preact/hooks';

import type { ObjectUrls } from './useObjectUrls.types';

/**
 * Кэш object URL стикеров по id: сетки перерисовываются часто, а новый URL на каждый
 * рендер перезагружал бы картинку и держал в памяти блобы, которые уже никто не показывает.
 * При размонтировании все URL отзываются.
 *
 * @returns `urlOf` — URL блоба (один на id), `dropUrl` — отзыв URL удалённого стикера
 */
export const useObjectUrls = (): ObjectUrls => {
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

  useEffect(() => {
    const urls = urlsRef.current;

    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  return { urlOf, dropUrl };
};
