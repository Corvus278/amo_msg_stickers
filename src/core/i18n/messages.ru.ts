/**
 * Русский — эталон словаря: ключи и имена подстановок `{…}` берутся из литеральных типов его строк.
 */
export const RU = {
  'picker.title': 'Стикеры и GIF',
  'picker.sections': 'Разделы стикеров',
  'footer.modes': 'Режимы',
  'footer.stickers': 'Стикеры',
  'footer.gifs': 'GIF',
  'footer.settings': 'Настройки',
  'screen.back': 'Назад',
  'add.title': 'Добавить стикеры',
  'add.createTile': 'Создать стикер',
  'add.telegram.title': 'Импорт из Telegram',
  'add.telegram.hint':
    'Ссылка на пак. Статичные, анимированные (.tgs) и видео-стикеры конвертируются в GIF.',
  'add.telegram.import': 'Импорт',
  'add.custom.title': 'Свой стикер',
  'add.custom.caption': 'Подпись (необязательно)',
  'add.custom.save': 'Сохранить в «Мои стикеры»',
  'add.custom.dropZone': 'Картинка, GIF, видео или .tgs — перетащите или кликните',
  'settings.title': 'Настройки',
  'settings.giphy.hint': 'Бесплатно на {link}',
  'settings.klipy.hint': 'Тестовый ключ в Partner Panel: {link}',
  'settings.telegram.label': 'Токен Telegram-бота (для импорта)',
  'settings.telegram.hint': 'Создайте любого бота в {link}. Токен хранится локально.',
  'settings.save': 'Сохранить',
} as const satisfies Record<string, string>;
