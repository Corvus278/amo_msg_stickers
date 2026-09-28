## 1. Каркас английской локали сайта

- [x] 1.1 В `docs/.vitepress/config.mts` вынести русские `nav`, `sidebar` и служебные подписи темы в
  `locales.root.themeConfig`, добавить локаль `en` (`lang: 'en-US'`, `label: 'English'`, `link: '/en/'`, свои
  `title`/`description`, английские `nav`, `sidebar` с путями `/en/...`, `outline`, `docFooter`, подписи темы,
  `langMenuLabel`, `notFound`), переводы локального поиска — через `search.options.locales` (`root`, `en`); обновить
  комментарий про второй язык; проверить `pnpm docs:build` после появления английских страниц (группа 2)
- [x] 1.2 `docs/.vitepress/theme/CopyCode.vue`: `title` и отметка по `useData().lang` — «Copy …»/«Copied» на
  английской странице, «Скопировать …»/«Скопировано» на остальных; проверить `pnpm typecheck` (проверяет
  `docs/tsconfig.json`)

## 2. Перевод страниц

- [x] 2.1 `docs/content/en/index.md` (hero, features, «What it is», видео с теми же файлами `../img/home/demo.*` и
  английским `aria-label`, фраза о том, что скрины сняты с русским интерфейсом) и
  `docs/content/en/install/{index,chromium,firefox,safari,desktop}.md`, фрагмент `docs/content/_parts/en/userscript.md`
  с картинками `../../img/...`, подключённый из английских страниц установки; `::::tabs` и `<CopyCode>` — как в
  русских; текст — typograf `en-US`, названия интерфейса amo stickers — из `src/core/i18n/messages.en.ts`
- [x] 2.2 `docs/content/en/setup/gif-keys.md` и `docs/content/en/setup/telegram.md`: те же шаги, скрины — те же файлы
  через `../../img/setup/...`, `alt` по-английски, ссылки внутри доки — на `/en/...`; typograf `en-US`
- [x] 2.3 `docs/content/en/update.md`, `docs/content/en/faq.md`, `docs/content/en/privacy.md`: скрины обновления через
  `../img/update/...`, ссылки внутри доки — на английские страницы; typograf `en-US`; проверить `pnpm docs:build`
  (битых ссылок нет) и что в собранном `docs/.vitepress/dist/en/` есть все 11 страниц

## 3. Ссылки из интерфейса по языку

- [ ] 3.1 `src/core/userDocs.ts`: `userDocsUrl(page, locale)` с префиксами языков `Record<Locale, string>`
  (`ru: ''`, `en: 'en/'`), убрать `GIF_KEYS_DOCS_URL` и `TELEGRAM_DOCS_URL`, комментарии — без «английской доки нет»;
  `SettingsView`, `GifView`, `TelegramImport` считают адрес в рендере через `getLocale()`
- [ ] 3.2 `src/core/i18n/messages.en.ts`: `settings.docs` и `add.telegram.docs` — «Step-by-step instructions»,
  `gifs.docs` — «How to get a key», без «(in Russian)»
- [ ] 3.3 Тесты: `tests/userDocs.test.ts` — исходник каждой страницы `USER_DOCS_PAGE` на обоих языках, адреса `ru`
  (корень) и `en` (`/en/`), локаль `en` в конфиге VitePress с `link: '/en/'`; новый тест пар страниц — у каждой `.md`
  в `docs/content/` вне `en/` и `_parts/` есть пара в `docs/content/en/` и наоборот; `pnpm test` зелёный

## 4. README, заметки разработчика, версия

- [ ] 4.1 `README.md`: рядом с «Установить →» — ссылка на английскую инструкцию
  (`https://mcar2107.github.io/amo_msg_stickers/en/install/`) и на английскую доку
- [ ] 4.2 `CLAUDE.md` (разделы про доку, структуру `docs/` и `userDocs*.ts`, «Язык интерфейса») и `docs/README.md`
  (что где, правила текста: правка страницы — в обоих языках, typograf `en-US` для английского, пути к картинкам из
  `en/`) — по новому устройству
- [ ] 4.3 Версия 0.14.0 в `package.json`, `src/extension/manifest.json` и `@version` в `build.mjs`; проверить
  `node scripts/check-version.mjs --base origin/master`

## 5. Итоговая проверка

- [ ] 5.1 `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm docs:build` зелёные; на `pnpm docs:preview` переключатель
  языка с `/install/firefox` ведёт на `/en/install/firefox` и обратно, поиск на английской странице находит только
  английские страницы, `CopyCode` на `/en/install/chromium` пишет «Copied»
