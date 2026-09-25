import { createPicker } from './ui/createPicker';
import { stickerIcon } from './ui/icons';
import { composerOf, findComposers, isDarkTheme } from './amoDom';
import type { Composer } from './amoDom.types';
import { getSticker, pushRecent } from './db';
import type { SendItem } from './db.types';
import type { Host } from './host.types';
import { BYTES_IN_MB } from './net';
import { SendError, sendFile, toCheckedGifFile, toGifFile } from './sender';

const MARK = 'data-amo-stickers';

/**
 * Спека ждёт на отправку вариант около 2 МБ (downsized у GIPHY), но KLIPY размер своего
 * `gif` не гарантирует: лимит — с запасом, чтобы не отсечь рабочую выдачу.
 */
const MAX_REMOTE_GIF_BYTES = 8 * BYTES_IN_MB;

/**
 * Классы повторяют обёртку кнопки эмодзи — tailwind-стили amo применяются без своего CSS.
 */
const WRAP_CLASS = 'relative z-100 mb-0 mr-3 flex h-full w-4.5 cursor-default items-end';
const INNER_CLASS = 'flex h-8 items-center';
const ICON_CLASS =
  'pointer-events-auto size-4.5 cursor-pointer fill-cadetGray-30 p-0 transition-all duration-base ease-linear dark:fill-gray-70';

/**
 * Базовый fill заменяется, а не дополняется: из двух fill-классов на элементе победит тот,
 * что стоит позже в CSS amo, а не тот, что нужен.
 */
const ICON_IDLE_CLASSES = ['fill-cadetGray-30', 'dark:fill-gray-70'];
const ICON_OPEN_CLASSES = ['fill-blue-50', 'dark:fill-beige-70'];

const setIconOpen = (button: HTMLElement | null, isOpen: boolean) => {
  const icon = button?.querySelector('svg');

  if (!icon) return;
  icon.classList.remove(...(isOpen ? ICON_IDLE_CLASSES : ICON_OPEN_CLASSES));
  icon.classList.add(...(isOpen ? ICON_OPEN_CLASSES : ICON_IDLE_CLASSES));
};

export const start = (host: Host) => {
  if (window.__amoStickers) return;
  window.__amoStickers = true;

  let activeButton: HTMLElement | null = null;

  const toFile = async (item: SendItem) => {
    switch (item.kind) {
      case 'local': {
        const sticker = await getSticker(item.stickerId);

        if (!sticker) throw new SendError('Стикер удалён');

        return toGifFile(sticker.blob);
      }

      case 'remote': {
        const blob = await host.fetchBlob(item.gif.url, MAX_REMOTE_GIF_BYTES);

        return toCheckedGifFile(blob, 'gif');
      }

      default: {
        const unknownItem: never = item;

        throw new Error(`Unknown send item: ${JSON.stringify(unknownItem)}`);
      }
    }
  };

  const send = async (item: SendItem) => {
    const composer = activeButton && composerOf(activeButton);

    if (!composer) throw new SendError('Поле ввода не найдено');

    await sendFile(composer, await toFile(item));
    await pushRecent(item);
  };

  const picker = createPicker(host, {
    onSend: send,
    onClose: () => {
      setIconOpen(activeButton, false);
      activeButton = null;
    },
  });

  picker.setTheme(isDarkTheme());

  const toggle = (button: HTMLElement) => {
    if (picker.isOpen && activeButton === button) {
      picker.close();

      return;
    }

    if (picker.isOpen) picker.close();
    activeButton = button;
    /**
     * Хост попапа живёт внутри кнопки: position:fixed считается от ближайшего предка
     * с transform — контейнера поля ввода, как у родного попапа эмодзи.
     */
    button.append(picker.element);
    setIconOpen(button, true);
    picker.open();
  };

  const mount = ({ emojiWrap }: Composer) => {
    const wrap = document.createElement('div');

    wrap.setAttribute(MARK, '');
    wrap.className = WRAP_CLASS;
    const inner = document.createElement('div');

    inner.className = INNER_CLASS;
    /**
     * title на inner, а не на wrap: иначе подсказка всплывает над всем попапом.
     */
    inner.title = 'Стикеры и GIF';
    inner.innerHTML = stickerIcon(ICON_CLASS);
    inner.addEventListener('click', () => {
      return toggle(wrap);
    });
    wrap.append(inner);
    emojiWrap.after(wrap);
  };

  const scan = () => {
    for (const composer of findComposers()) {
      if (!composer.row.querySelector(`:scope > [${MARK}]`)) mount(composer);
    }

    if (picker.isOpen && !picker.element.isConnected) picker.close();
  };

  let isScanScheduled = false;

  const scheduleScan = () => {
    if (isScanScheduled) return;
    isScanScheduled = true;
    requestAnimationFrame(() => {
      isScanScheduled = false;
      scan();
    });
  };

  const handleDocumentMouseDown = (event: MouseEvent) => {
    if (!picker.isOpen || !activeButton) return;
    if (!event.composedPath().includes(activeButton)) picker.close();
  };

  new MutationObserver(scheduleScan).observe(document.body, {
    childList: true,
    subtree: true,
  });
  new MutationObserver(() => {
    return picker.setTheme(isDarkTheme());
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  document.addEventListener('mousedown', handleDocumentMouseDown, true);

  scan();
  console.info(`[amo-stickers] started (${host.name})`);
};
