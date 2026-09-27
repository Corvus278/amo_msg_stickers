/**
 * Режим попапа: лента стикеров или выдача GIF.
 */
export type PickerMode = 'stickers' | 'gifs';

/**
 * Срез `Storage`, которым пользуется модуль режима: тест подставляет своё хранилище.
 */
export type ModeStorage = Pick<Storage, 'getItem' | 'setItem'>;
