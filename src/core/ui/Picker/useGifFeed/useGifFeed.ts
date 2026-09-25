import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import type { RemoteGif } from '../../../db.types';
import { fetchGifs } from '../../../sources/gifs';
import type { GifFeed } from '../../../sources/gifs.types';
import { errorMessage } from '../PickerProvider/errorMessage';
import { usePicker } from '../PickerProvider/usePicker';

import type { GifFeedState } from './useGifFeed.types';

const GIF_SEARCH_DEBOUNCE_MS = 350;

/**
 * Запас до низа ленты GIF, с которого подгружается следующая страница: догружаем заранее,
 * чтобы пользователь не упирался в конец при прокрутке.
 */
const LOAD_MORE_THRESHOLD_PX = 200;

const gifKey = ({ provider, id }: RemoteGif) => {
  return `${provider}:${id}`;
};

/**
 * Дописывает страницу к выдаче без повторов: трендовая выдача меняется между запросами
 * страниц, и один GIF может прийти дважды, а повторный ключ в списке Preact путает
 * ячейки при перерисовке.
 *
 * @param gifs — уже показанная выдача
 * @param page — GIF новой страницы
 * @returns выдача с новыми GIF в конце
 */
const appendPage = (gifs: RemoteGif[], page: RemoteGif[]) => {
  const keys = new Set(gifs.map(gifKey));

  return page.reduce<RemoteGif[]>(
    (acc, gif) => {
      const key = gifKey(gif);

      if (!keys.has(key)) {
        keys.add(key);
        acc.push(gif);
      }

      return acc;
    },
    [...gifs]
  );
};

/**
 * Лента GIF выбранного источника: тренды при пустом запросе, поиск через 350 мс после
 * последнего ввода, подгрузка страниц при прокрутке. Выдача перезагружается на каждое
 * открытие пикера и на смену источника, запроса или ключей; ответ, пришедший после такой
 * смены или после закрытия, отбрасывается. Ошибка — в строке статуса с префиксом «GIF:»,
 * уже загруженная выдача при этом остаётся.
 *
 * @param feed — источник; `null` — ключей нет, лента не грузится
 * @param query — текст поля поиска как есть, без debounce
 * @param isOpen — открыт ли пикер
 * @returns выдача и подгрузка по прокрутке
 */
export const useGifFeed = (
  feed: GifFeed | null,
  query: string,
  isOpen: boolean
): GifFeedState => {
  const { env, settings, showError } = usePicker();
  const { giphyKey, klipyKey } = settings;
  const [term, setTerm] = useState(query.trim());
  const [gifs, setGifs] = useState<RemoteGif[]>([]);
  const [isNothingFound, setIsNothingFound] = useState(false);

  /**
   * Номер последнего запроса: ответ устаревшего запроса не попадает в выдачу.
   */
  const requestRef = useRef(0);
  const nextRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  /**
   * Настройки читаются через ref: провайдер отдаёт новый объект на каждое открытие, и
   * перезагрузка по нему дала бы второй запрос с теми же ключами. Перезагрузку
   * запускает смена самих ключей.
   */
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(query.trim());
    }, GIF_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const load = useCallback(
    async (shouldReset: boolean) => {
      if (!feed || (!shouldReset && isLoadingRef.current)) return;
      requestRef.current += 1;
      const request = requestRef.current;

      if (shouldReset) {
        nextRef.current = null;
        setGifs([]);
        setIsNothingFound(false);
      }

      isLoadingRef.current = true;

      try {
        const page = await fetchGifs(
          env,
          settingsRef.current,
          feed,
          term,
          shouldReset ? null : nextRef.current
        );

        if (request !== requestRef.current) return;
        nextRef.current = page.next;

        setGifs((prev) => {
          return appendPage(shouldReset ? [] : prev, page.items);
        });

        if (shouldReset && !page.items.length) setIsNothingFound(true);
      } catch (error) {
        if (request === requestRef.current) showError(`GIF: ${errorMessage(error)}`);
      } finally {
        if (request === requestRef.current) isLoadingRef.current = false;
      }
    },
    [env, feed, term, showError]
  );

  useEffect(() => {
    if (!isOpen) return;

    void load(true);

    return () => {
      requestRef.current += 1;
      isLoadingRef.current = false;
    };
  }, [isOpen, load, giphyKey, klipyKey]);

  const checkScroll = useCallback(
    (element: HTMLElement) => {
      if (!nextRef.current) return;
      const { scrollTop, clientHeight, scrollHeight } = element;

      if (scrollTop + clientHeight > scrollHeight - LOAD_MORE_THRESHOLD_PX)
        void load(false);
    },
    [load]
  );

  return { gifs, isNothingFound, checkScroll };
};
