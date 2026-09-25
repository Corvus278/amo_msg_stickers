import { captionDecorator, detectKind, toStickerGif } from '../convert';
import type { GifResult } from '../convert.types';
import {
  CUSTOM_PACK_ID,
  deletePack,
  deleteRecent,
  deleteSticker,
  ensureCustomPack,
  getSticker,
  listPacks,
  listRecent,
  listStickers,
  putSticker,
  uid,
} from '../db';
import type { Pack, SendItem } from '../db.types';
import { DEFAULT_SETTINGS } from '../host';
import type { Host, Settings } from '../host.types';
import { availableFeeds, FEED_LABELS, fetchGifs } from '../sources/gifs';
import type { GifFeed } from '../sources/gifs.types';
import { importTelegramSet } from '../sources/telegram';

import { CLOCK_ICON, PLUS_ICON, SETTINGS_ICON, SMILE_ICON } from './icons';
import type { Attrs, Child, PickerCallbacks, Timer, View } from './picker.types';
import { PICKER_CSS } from './styles';

const GIF_SEARCH_DEBOUNCE_MS = 350;
const CAPTION_DEBOUNCE_MS = 500;
const CONFIRM_RESET_MS = 2500;
const BYTES_IN_KB = 1024;

/**
 * Запас до низа ленты GIF, с которого подгружается следующая страница: догружаем заранее,
 * чтобы пользователь не упирался в конец при прокрутке.
 */
const LOAD_MORE_THRESHOLD_PX = 200;

/**
 * Подпись источника под лентой — условие использования API у обоих провайдеров.
 */
const FEED_ATTRIBUTION: Record<GifFeed, string> = {
  'giphy-gifs': 'Powered by GIPHY',
  'giphy-stickers': 'Powered by GIPHY',
  klipy: 'Powered by KLIPY',
};

const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }

  for (const c of children) if (c) el.append(c);

  return el;
};

const errorMessage = (e: unknown) => {
  return e instanceof Error ? e.message : String(e);
};

/**
 * Двойное нажатие вместо confirm(): модальные диалоги блокируют страницу.
 *
 * @returns true — нажатие подтверждающее, действие можно выполнять
 */
const confirmInline = (btn: HTMLElement, text: string) => {
  if (btn.dataset.armed) return true;
  const original = btn.textContent;

  btn.dataset.armed = '1';
  btn.textContent = text;
  setTimeout(() => {
    delete btn.dataset.armed;
    btn.textContent = original;
  }, CONFIRM_RESET_MS);

  return false;
};

export class Picker {
  readonly host: HTMLElement;
  private root: ShadowRoot;
  private panel: HTMLElement;
  private headEl: HTMLElement;
  private bodyEl: HTMLElement;
  private statusEl: HTMLElement;
  private tabsEl: HTMLElement;

  private view: View = { kind: 'recent' };
  private settings: Settings = DEFAULT_SETTINGS;
  private packs: Pack[] = [];
  private urls = new Map<string, string>();
  private renderToken = 0;

  private gifFeed: GifFeed | null = null;
  private gifQuery = '';
  private gifNext: string | null = null;
  private isGifLoading = false;
  private gifSeq = 0;

  constructor(
    private env: Host,
    private callbacks: PickerCallbacks
  ) {
    this.host = h('div', { 'data-amo-stickers-picker': true });
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.append(h('style', {}, PICKER_CSS));

    this.headEl = h('div', { class: 'head' });
    this.bodyEl = h('div', { class: 'body' });
    this.statusEl = h('div', { class: 'status', hidden: true });
    this.tabsEl = h('nav', { class: 'tabs' });
    this.panel = h(
      'div',
      { class: 'panel', hidden: true },
      this.headEl,
      this.bodyEl,
      this.statusEl,
      this.tabsEl
    );
    this.root.append(this.panel);

    this.bodyEl.addEventListener('scroll', () => {
      return this.handleBodyScroll();
    });
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();

      /**
       * Не отдаём хоткеи amo, пока печатаем в поиске.
       */
      e.stopPropagation();
    });
  }

  get isOpen() {
    return !this.panel.hidden;
  }

  setTheme(isDark: boolean) {
    this.host.dataset.theme = isDark ? 'dark' : 'light';
  }

  async open() {
    this.panel.hidden = false;
    this.setStatus(null);
    this.settings = await this.env.getSettings();
    await ensureCustomPack();
    await this.refreshPacks();
    const recent = await listRecent();

    if (this.view.kind === 'recent' && !recent.length) this.view = { kind: 'gifs' };
    await this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.panel.hidden = true;
    this.callbacks.onClose();
  }

  setStatus(text: string | null, isError = false) {
    this.statusEl.hidden = !text;
    this.statusEl.textContent = text || '';
    this.statusEl.classList.toggle('error', isError);
  }

  private async refreshPacks() {
    this.packs = await listPacks();
  }

  private async refreshTabs() {
    await this.refreshPacks();
    this.renderTabs();
  }

  private stickerUrl(id: string, blob: Blob) {
    let url = this.urls.get(id);

    if (!url) {
      url = URL.createObjectURL(blob);
      this.urls.set(id, url);
    }

    return url;
  }

  private dropUrl(id: string) {
    const url = this.urls.get(id);

    if (url) URL.revokeObjectURL(url);
    this.urls.delete(id);
  }

  private async doSend(item: SendItem, cell: HTMLElement) {
    cell.classList.add('busy');
    this.setStatus('Отправляю…');

    try {
      await this.callbacks.onSend(item);
      this.setStatus(null);
      this.close();
    } catch (e) {
      this.setStatus(errorMessage(e) || 'Ошибка отправки', true);
    } finally {
      cell.classList.remove('busy');
    }
  }

  private switchTo(view: View) {
    this.gifSeq++;
    this.isGifLoading = false;
    this.view = view;
    this.setStatus(null);
    void this.render();
  }

  private async render() {
    const token = ++this.renderToken;

    this.renderTabs();
    this.headEl.replaceChildren();
    this.bodyEl.replaceChildren();
    this.bodyEl.scrollTop = 0;

    switch (this.view.kind) {
      case 'recent': {
        return this.renderRecent(token);
      }

      case 'gifs': {
        return this.renderGifs();
      }

      case 'pack': {
        return this.renderPack(this.view.packId, token);
      }

      case 'add': {
        return this.renderAdd();
      }

      case 'settings': {
        return this.renderSettings();
      }

      default: {
        throw new Error('Unknown picker view');
      }
    }
  }

  private renderTabs() {
    const v = this.view;

    const tab = (
      label: string,
      isSelected: boolean,
      onclick: () => void,
      content: Node | string
    ) => {
      return h(
        'button',
        { class: 'tab', title: label, 'aria-selected': String(isSelected), onclick },
        content
      );
    };

    const icon = (html: string) => {
      return h('span', { html, style: 'display:flex' });
    };

    const packTabs = this.packs.map((p) => {
      const content = h('span', { style: 'display:flex' });

      void this.fillPackTab(content, p);

      return tab(
        p.title,
        v.kind === 'pack' && v.packId === p.id,
        () => {
          return this.switchTo({ kind: 'pack', packId: p.id });
        },
        content
      );
    });

    this.tabsEl.replaceChildren(
      tab(
        'Недавние',
        v.kind === 'recent',
        () => {
          return this.switchTo({ kind: 'recent' });
        },
        icon(CLOCK_ICON)
      ),
      tab(
        'GIF',
        v.kind === 'gifs',
        () => {
          return this.switchTo({ kind: 'gifs' });
        },
        'GIF'
      ),
      ...packTabs,
      h('div', { class: 'spacer' }),
      tab(
        'Добавить стикеры',
        v.kind === 'add',
        () => {
          return this.switchTo({ kind: 'add' });
        },
        icon(PLUS_ICON)
      ),
      tab(
        'Настройки',
        v.kind === 'settings',
        () => {
          return this.switchTo({ kind: 'settings' });
        },
        icon(SETTINGS_ICON)
      )
    );
  }

  private async fillPackTab(content: HTMLElement, pack: Pack) {
    const url = await this.packCover(pack);

    if (url) content.replaceChildren(h('img', { src: url, alt: '' }));
    else if (pack.id === CUSTOM_PACK_ID) content.innerHTML = SMILE_ICON;
    else content.textContent = pack.title.slice(0, 2);
  }

  private async packCover(pack: Pack): Promise<string | null> {
    const id = pack.coverId || (await listStickers(pack.id))[0]?.id;

    if (!id) return null;
    const sticker = await getSticker(id);

    return sticker ? this.stickerUrl(sticker.id, sticker.blob) : null;
  }

  private stickerCell(
    id: string,
    url: string,
    onSend: (cell: HTMLElement) => void,
    onDelete?: () => void
  ) {
    const cell = h(
      'div',
      { class: 'cell', role: 'button', tabindex: 0, 'data-id': id },
      h('img', { src: url, alt: '', loading: 'lazy' })
    );

    cell.addEventListener('click', () => {
      return onSend(cell);
    });

    if (onDelete) {
      cell.append(
        h(
          'button',
          {
            class: 'del',
            title: 'Удалить',
            onclick: (e: Event) => {
              e.stopPropagation();
              onDelete();
            },
          },
          '×'
        )
      );
    }

    return cell;
  }

  private async recentUrl(item: SendItem) {
    switch (item.kind) {
      case 'local': {
        const sticker = await getSticker(item.stickerId);

        return sticker ? this.stickerUrl(sticker.id, sticker.blob) : null;
      }

      case 'remote': {
        return item.gif.previewUrl;
      }

      default: {
        throw new Error('Unknown send item kind');
      }
    }
  }

  private async renderRecent(token: number) {
    this.headEl.append(
      h('div', { class: 'head-row' }, h('span', { class: 'title' }, 'Недавние'))
    );
    const recent = await listRecent();

    if (token !== this.renderToken) return;

    if (!recent.length) {
      this.bodyEl.append(
        h('div', { class: 'empty' }, 'Здесь появятся отправленные стикеры и GIF')
      );

      return;
    }

    const grid = h('div', { class: 'grid' });

    for (const { key, item } of recent) {
      const url = await this.recentUrl(item);

      if (!url) continue;

      grid.append(
        this.stickerCell(
          key,
          url,
          (cell) => {
            return this.doSend(item, cell);
          },
          async () => {
            await deleteRecent(item);
            void this.render();
          }
        )
      );
    }

    if (token === this.renderToken) this.bodyEl.append(grid);
  }

  private renderGifs() {
    const feeds = availableFeeds(this.settings);

    if (!feeds.length) {
      this.bodyEl.append(
        h(
          'div',
          { class: 'empty' },
          'Для поиска GIF нужен API-ключ GIPHY или KLIPY.',
          h('br'),
          h(
            'a',
            {
              href: '#',
              onclick: (e: Event) => {
                e.preventDefault();
                this.switchTo({ kind: 'settings' });
              },
            },
            'Открыть настройки'
          )
        )
      );

      return;
    }

    if (!this.gifFeed || !feeds.includes(this.gifFeed)) this.gifFeed = feeds[0] || null;

    let debounce: Timer;
    const search = h('input', {
      type: 'search',
      placeholder: 'Поиск GIF',
      value: this.gifQuery,
    });

    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.gifQuery = search.value.trim();
        void this.loadGifs(true);
      }, GIF_SEARCH_DEBOUNCE_MS);
    });

    const chips =
      feeds.length > 1
        ? h(
            'div',
            { class: 'chips' },
            ...feeds.map((f) => {
              return h(
                'button',
                {
                  class: 'chip',
                  'aria-pressed': String(f === this.gifFeed),
                  onclick: () => {
                    this.gifFeed = f;
                    void this.render();
                  },
                },
                FEED_LABELS[f]
              );
            })
          )
        : null;

    this.headEl.append(search, chips || '');
    setTimeout(() => {
      return search.focus();
    }, 0);
    void this.loadGifs(true);
  }

  private async loadGifs(shouldReset: boolean) {
    if (!this.gifFeed || (!shouldReset && this.isGifLoading)) return;
    const seq = ++this.gifSeq;
    let grid = this.bodyEl.querySelector<HTMLElement>('.masonry');

    if (shouldReset || !grid) {
      this.gifNext = null;
      grid = h('div', { class: 'masonry' });
      const attr = h('div', { class: 'attr' }, FEED_ATTRIBUTION[this.gifFeed]);

      this.bodyEl.replaceChildren(grid, attr);
    }

    this.isGifLoading = true;

    try {
      const page = await fetchGifs(
        this.env,
        this.settings,
        this.gifFeed,
        this.gifQuery,
        shouldReset ? null : this.gifNext
      );

      if (seq !== this.gifSeq) return;
      this.gifNext = page.next;

      for (const gif of page.items) {
        const item: SendItem = { kind: 'remote', gif };
        const cell = this.stickerCell(
          `${gif.provider}:${gif.id}`,
          gif.previewUrl,
          (c) => {
            return this.doSend(item, c);
          }
        );

        cell.style.aspectRatio = `${gif.width} / ${gif.height}`;
        grid.append(cell);
      }

      if (!page.items.length && shouldReset)
        grid.replaceWith(h('div', { class: 'empty' }, 'Ничего не нашлось'));
    } catch (e) {
      if (seq === this.gifSeq) this.setStatus(`GIF: ${errorMessage(e)}`, true);
    } finally {
      if (seq === this.gifSeq) this.isGifLoading = false;
    }
  }

  private handleBodyScroll() {
    if (this.view.kind !== 'gifs' || !this.gifNext) return;
    const { scrollTop, clientHeight, scrollHeight } = this.bodyEl;

    if (scrollTop + clientHeight > scrollHeight - LOAD_MORE_THRESHOLD_PX)
      void this.loadGifs(false);
  }

  private async renderPack(packId: string, token: number) {
    const pack = this.packs.find((p) => {
      return p.id === packId;
    });

    if (!pack) return this.switchTo({ kind: 'recent' });

    const del =
      pack.id !== CUSTOM_PACK_ID
        ? h(
            'button',
            {
              class: 'btn danger',
              onclick: async ({ currentTarget }: Event) => {
                if (!(currentTarget instanceof HTMLElement)) return;
                if (!confirmInline(currentTarget, 'Точно удалить?')) return;
                await deletePack(pack.id);
                await this.refreshPacks();
                this.switchTo({ kind: 'recent' });
              },
            },
            'Удалить пак'
          )
        : null;

    this.headEl.append(
      h(
        'div',
        { class: 'head-row' },
        h('span', { class: 'title' }, pack.title),
        del || ''
      )
    );

    const stickers = await listStickers(pack.id);

    if (token !== this.renderToken) return;

    if (!stickers.length) {
      this.bodyEl.append(
        h(
          'div',
          { class: 'empty' },
          pack.id === CUSTOM_PACK_ID ? 'Создайте свой стикер во вкладке «+»' : 'Пак пуст'
        )
      );

      return;
    }

    const grid = h('div', { class: 'grid' });

    for (const { id, blob } of stickers) {
      const item: SendItem = { kind: 'local', stickerId: id };

      grid.append(
        this.stickerCell(
          id,
          this.stickerUrl(id, blob),
          (cell) => {
            return this.doSend(item, cell);
          },
          async () => {
            await deleteSticker(id);
            this.dropUrl(id);
            void this.render();
          }
        )
      );
    }

    this.bodyEl.append(grid);
  }

  private renderAdd() {
    this.headEl.append(
      h('div', { class: 'head-row' }, h('span', { class: 'title' }, 'Добавить стикеры'))
    );
    this.bodyEl.append(
      h('div', { class: 'form' }, ...this.telegramForm(), ...this.createForm())
    );
  }

  private telegramForm() {
    const input = h('input', { type: 'text', placeholder: 't.me/addstickers/…' });
    const bar = h('i', { style: 'width:0%' });
    const progress = h('div', { class: 'progress', hidden: true }, bar);
    const btn = h('button', { class: 'btn' }, 'Импорт');

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      progress.hidden = false;

      try {
        const pack = await importTelegramSet(
          this.env,
          this.settings.telegramToken,
          input.value,
          ({ done, total, title }) => {
            bar.style.width = `${total ? (done / total) * 100 : 0}%`;
            this.setStatus(`«${title}»: ${done}/${total}`);

            /**
             * Первый готовый стикер — сразу показываем вкладку пака, не дожидаясь импорта
             * целиком.
             */
            if (done === 1) void this.refreshTabs();
          }
        );

        await this.refreshPacks();
        this.setStatus(`Пак «${pack.title}» добавлен`);
        this.view = { kind: 'pack', packId: pack.id };
        void this.render();
      } catch (e) {
        this.setStatus(errorMessage(e), true);
      } finally {
        btn.disabled = false;
      }
    });

    return [
      h('h3', {}, 'Импорт из Telegram'),
      h(
        'p',
        {},
        'Ссылка на пак. Статичные, анимированные (.tgs) и видео-стикеры конвертируются в GIF.'
      ),
      h('div', { class: 'row' }, input, btn),
      progress,
    ];
  }

  private createForm() {
    let source: File | null = null;
    let result: GifResult | null = null;

    const fileInput = h('input', { type: 'file', accept: 'image/*,video/*,.tgs' });
    const dropLabel = h(
      'span',
      {},
      'Картинка, GIF, видео или .tgs — перетащите или кликните'
    );
    const drop = h('div', { class: 'drop' }, dropLabel, fileInput);
    const caption = h('input', { type: 'text', placeholder: 'Подпись (необязательно)' });
    const preview = h('div', { class: 'preview', hidden: true });
    const save = h(
      'button',
      { class: 'btn', disabled: true },
      'Сохранить в «Мои стикеры»'
    );

    const rebuild = async () => {
      if (!source) return;
      save.disabled = true;
      this.setStatus('Конвертирую…');

      try {
        const text = caption.value.trim();

        result = await toStickerGif(source, detectKind(source, source.name), {
          decorate: text ? captionDecorator(text) : undefined,
        });
        const { blob, width, height } = result;

        preview.replaceChildren(h('img', { src: URL.createObjectURL(blob), alt: '' }));
        preview.hidden = false;
        save.disabled = false;
        this.setStatus(`${width}×${height}, ${Math.round(blob.size / BYTES_IN_KB)} КБ`);
      } catch (e) {
        this.setStatus(`Не получилось: ${errorMessage(e)}`, true);
      }
    };

    const pick = (file: File | undefined) => {
      if (!file) return;
      source = file;
      dropLabel.textContent = file.name;
      void rebuild();
    };

    fileInput.addEventListener('change', () => {
      return pick(fileInput.files?.[0]);
    });
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.add('over');
    });
    drop.addEventListener('dragleave', () => {
      return drop.classList.remove('over');
    });
    drop.addEventListener('drop', (e) => {
      /**
       * amo слушает drop на body и прикрепит файл к сообщению — не пускаем.
       */
      e.preventDefault();
      e.stopPropagation();
      drop.classList.remove('over');
      pick(e.dataTransfer?.files[0]);
    });
    let captionTimer: Timer;

    caption.addEventListener('input', () => {
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => {
        void rebuild();
      }, CAPTION_DEBOUNCE_MS);
    });

    save.addEventListener('click', async () => {
      if (!result) return;
      const { blob, width, height } = result;

      await putSticker({
        id: uid(),
        packId: CUSTOM_PACK_ID,
        blob,
        width,
        height,
        createdAt: Date.now(),
      });
      await this.refreshPacks();
      this.switchTo({ kind: 'pack', packId: CUSTOM_PACK_ID });
    });

    return [
      h('h3', {}, 'Свой стикер'),
      drop,
      caption,
      preview,
      h('div', { class: 'row' }, save),
    ];
  }

  private renderSettings() {
    this.headEl.append(
      h('div', { class: 'head-row' }, h('span', { class: 'title' }, 'Настройки'))
    );

    const inputs = new Map<keyof Settings, HTMLInputElement>();

    const field = (key: keyof Settings, label: string, hint: Node) => {
      const input = h('input', {
        type: 'password',
        value: this.settings[key],
        autocomplete: 'off',
      });

      inputs.set(key, input);

      return h('label', {}, label, input, h('p', {}, hint));
    };

    const link = (href: string, text: string) => {
      return h('a', { href, target: '_blank', rel: 'noreferrer' }, text);
    };

    const frag = (...nodes: (Node | string)[]) => {
      const s = h('span');

      s.append(...nodes);

      return s;
    };

    const form = h(
      'div',
      { class: 'form' },
      field(
        'giphyKey',
        'GIPHY API key',
        frag(
          'Бесплатно на ',
          link('https://developers.giphy.com/dashboard/', 'developers.giphy.com')
        )
      ),
      field(
        'klipyKey',
        'KLIPY API key',
        frag(
          'Тестовый ключ в Partner Panel: ',
          link('https://klipy.com/migrate', 'klipy.com')
        )
      ),
      field(
        'telegramToken',
        'Токен Telegram-бота (для импорта)',
        frag(
          'Создайте любого бота в ',
          link('https://t.me/BotFather', '@BotFather'),
          '. Токен хранится локально.'
        )
      ),
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          {
            class: 'btn',
            onclick: async () => {
              const patch: Partial<Settings> = {};

              for (const [key, input] of inputs) patch[key] = input.value.trim();
              await this.env.setSettings(patch);
              this.settings = await this.env.getSettings();
              this.setStatus('Сохранено');
            },
          },
          'Сохранить'
        )
      )
    );

    this.bodyEl.append(form);
  }
}
