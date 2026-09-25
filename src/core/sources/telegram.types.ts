export type TgSticker = {
  /**
   * Идентификатор файла для `getFile`.
   */
  file_id: string;

  /**
   * Постоянный идентификатор файла: одинаков у разных ботов, поэтому идёт в id стикера.
   */
  file_unique_id: string;

  /**
   * Эмодзи, привязанный к стикеру.
   */
  emoji?: string;

  /**
   * Анимированный стикер в формате TGS (Lottie).
   */
  is_animated: boolean;

  /**
   * Видеостикер в формате WebM.
   */
  is_video: boolean;
};

export type TgStickerSet = {
  /**
   * Короткое имя набора из ссылки t.me/addstickers/<name>.
   */
  name: string;

  /**
   * Отображаемое название набора.
   */
  title: string;

  /**
   * Стикеры набора в порядке Telegram.
   */
  stickers: TgSticker[];
};

export type TgFile = {
  /**
   * Путь для скачивания через `https://api.telegram.org/file/bot<token>/<file_path>`.
   */
  file_path: string;
};

export type TgResponse<T> = {
  /**
   * false — запрос не выполнен, причина в `description`.
   */
  ok: boolean;

  /**
   * Результат метода Bot API.
   */
  result: T;

  /**
   * Текст ошибки от Telegram.
   */
  description?: string;
};

export type ImportProgress = {
  /**
   * Сколько стикеров обработано, включая упавшие при конвертации.
   */
  done: number;

  /**
   * Всего стикеров в наборе.
   */
  total: number;

  /**
   * Название импортируемого набора.
   */
  title: string;
};
