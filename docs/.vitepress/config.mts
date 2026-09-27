import { defineConfig } from 'vitepress';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

const REPO_URL = 'https://github.com/Corvus278/amo_msg_stickers';

/**
 * Сайт живёт на GitHub Pages проекта: адрес страницы — база плюс путь файла без `.md`.
 * База нужна и отдельно: ссылки в `head` VitePress не дополняет ею, в отличие от ссылок
 * страниц и логотипа.
 */
const BASE = '/amo_msg_stickers/';

/**
 * Конфиг сайта доки. VitePress читает только экспорт по умолчанию.
 *
 * Битые внутренние ссылки VitePress считает ошибкой сборки — это и есть проверка ссылок,
 * поэтому `ignoreDeadLinks` не задаётся.
 */
export default defineConfig({
  title: 'amo stickers',
  description: 'Стикеры и GIF для мессенджера amo',
  base: BASE,
  /**
   * Страницы — в `content/`, отдельно от пакета и конфига: в корне `docs/` лежат
   * `package.json`, lockfile и `node_modules`, и тексты среди них терялись бы.
   */
  srcDir: 'content',
  /**
   * `public/` — рядом с `content/`, а не внутри: там статика сайта (логотип), не страницы.
   * Vite считает путь от корня проекта, а корнем VitePress делает `srcDir`.
   */
  vite: {
    publicDir: '../public',
  },
  /**
   * Иконка вкладки — под тему системы: у браузера нет темы сайта, переключатель VitePress
   * до вкладки не доходит.
   */
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}logo-light.svg` }],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `${BASE}logo-dark.svg`,
        media: '(prefers-color-scheme: dark)',
      },
    ],
  ],
  lang: 'ru-RU',
  cleanUrls: true,
  /**
   * Общие фрагменты подключаются в страницы `@include`: без исключения каждый собрался бы
   * отдельной страницей со своим адресом и попал бы в поиск.
   */
  srcExclude: ['_parts/**'],
  /**
   * Русский — корень: второй язык встанет каталогом `/en/`, и адреса русских страниц
   * не поменяются.
   */
  locales: {
    root: {
      label: 'Русский',
      lang: 'ru-RU',
    },
  },
  markdown: {
    config: (md) => {
      md.use(tabsMarkdownPlugin);
    },
  },
  themeConfig: {
    logo: { light: '/logo-light.svg', dark: '/logo-dark.svg', alt: '' },
    nav: [
      { text: 'Установка', link: '/install/' },
      { text: 'Настройка', link: '/setup/gif-keys' },
      { text: 'Частые вопросы', link: '/faq' },
    ],
    sidebar: [
      {
        text: 'Установка',
        link: '/install/',
        items: [
          { text: 'Chrome, Edge, Яндекс Браузер, Opera', link: '/install/chromium' },
          { text: 'Firefox', link: '/install/firefox' },
          { text: 'Safari', link: '/install/safari' },
          { text: 'Приложение amo', link: '/install/desktop' },
        ],
      },
      {
        text: 'Настройка',
        items: [
          { text: 'Ключи GIF', link: '/setup/gif-keys' },
          { text: 'Импорт из Telegram', link: '/setup/telegram' },
        ],
      },
      {
        text: 'Помощь',
        items: [
          { text: 'Обновление', link: '/update' },
          { text: 'Частые вопросы', link: '/faq' },
          { text: 'Политика конфиденциальности', link: '/privacy' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: REPO_URL }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Поиск',
            buttonAriaLabel: 'Поиск',
          },
          modal: {
            displayDetails: 'Подробный список',
            resetButtonTitle: 'Сбросить поиск',
            backButtonTitle: 'Закрыть поиск',
            noResultsText: 'Ничего не нашлось',
            footer: {
              selectText: 'выбрать',
              navigateText: 'перейти',
              closeText: 'закрыть',
            },
          },
        },
      },
    },
    outline: { label: 'На странице' },
    docFooter: { prev: 'Назад', next: 'Дальше' },
    darkModeSwitchLabel: 'Тема',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Тёмная тема',
    sidebarMenuLabel: 'Меню',
    returnToTopLabel: 'Наверх',
    langMenuLabel: 'Язык',
    notFound: {
      title: 'Страница не найдена',
      quote: 'Такой страницы в доке нет — возможно, её переименовали.',
      linkText: 'На главную',
    },
  },
});
