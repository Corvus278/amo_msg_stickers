import type { RefObject } from 'preact';

import type { RemoteGif } from '../../../../db.types';

export type GifRemovalFocus = {
  /**
   * Ссылка для кнопки «Открыть настройки»: без ключей поля поиска нет, и фокус после удаления
   * уходит на неё.
   */
  settingsRef: RefObject<HTMLButtonElement>;

  /**
   * Запоминает цели фокуса перед «Убрать из недавних».
   */
  expectGifRemoval: (gif: RemoteGif) => void;

  /**
   * Запоминает цель фокуса перед «Очистить».
   */
  expectRecentClear: () => void;
};
