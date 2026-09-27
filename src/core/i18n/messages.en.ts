import type { Messages } from './i18n.types';

/**
 * Без ключа из `RU` или с лишним ключом словарь не компилируется.
 */
export const EN: Messages = {
  'picker.title': 'Stickers and GIFs',
  'picker.sections': 'Sticker sections',
  'footer.modes': 'Modes',
  'footer.stickers': 'Stickers',
  'footer.gifs': 'GIFs',
  'footer.settings': 'Settings',
  'screen.back': 'Back',
  'add.title': 'Add stickers',
  'add.createTile': 'Create sticker',
  'add.telegram.title': 'Import from Telegram',
  'add.telegram.hint':
    'Pack link. Static, animated (.tgs) and video stickers are converted to GIF.',
  'add.telegram.import': 'Import',
  'add.custom.title': 'Custom sticker',
  'add.custom.caption': 'Caption (optional)',
  'add.custom.save': 'Save to “My stickers”',
  'add.custom.dropZone': 'Image, GIF, video or .tgs — drag and drop or click',
  'settings.title': 'Settings',
  'settings.giphy.hint': 'Free at {link}',
  'settings.klipy.hint': 'Test key in the Partner Panel: {link}',
  'settings.telegram.label': 'Telegram bot token (for import)',
  'settings.telegram.hint': 'Create any bot in {link}. The token is stored locally.',
  'settings.save': 'Save',
};
