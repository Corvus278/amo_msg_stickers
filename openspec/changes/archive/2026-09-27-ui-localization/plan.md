# План прогона: ui-localization

База прогона: `19d817fae128e7902fb2da10f8cde79251e527c0`
Гейт: `pnpm lint && pnpm test`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest run --project=unit tests/<файл>.test.ts`
Долгие слои: стенд — `pnpm build`, `python3 -m http.server 8777 -b 127.0.0.1`, `http://127.0.0.1:8777/dev/harness.html`
(headless Chrome + chrome-devtools, см. `CLAUDE.local.md`) — группы G1, G2, G3, G4, G7, G8; живой amo — G9
Хук коммита: lint-staged + `pnpm typecheck` + `vitest --changed` — каждая группа оставляет типы и тесты зелёными.

## Контракты

- **K1 API языка** — `src/core/i18n/translate.ts`: `setLocale`, `getLocale` (по умолчанию `'ru'`), `t(key, params)`;
  тест с `setLocale('en')` возвращает `'ru'` в `afterEach`. Владелец G1; потребители G2–G6.
- **K2 Словарь — хаб** — ключи добавляются парой в `RU` (`messages.ru.ts`) и `EN` (`messages.en.ts`) только группой,
  которой они нужны; префиксы: G2 `picker.` `footer.` `screen.` `add.` `settings.`, G3 `stickers.` `pack.` `cell.`
  `menu.`, G4 `gifs.` `status.`, G5–G6 `error.`. Словарь правят G1–G6, поэтому они в разных волнах.
- **K3 `LocalizedError`** — `Error` с `key: MessageKey`, `params`, `message = t(key, params)` при создании. Владелец
  G1; потребители G6 (`net.ts`, `content.ts`).
- **K4 Отказ SW** — `FetchResponse` `{ ok: false, error, key?, params? }`; `background.ts` кладёт `key`/`params`
  только для `LocalizedError`; разбор ответа в `content.ts` — `new LocalizedError(key, params)` при `key`, иначе
  `new Error(error)`. Владелец G6.
- **K5 `packTitle(pack)`** — `ui/Picker/packTitle/`: `CUSTOM_PACK_ID` → `t('pack.custom')`, иначе `pack.title`; любой
  показ названия пака идёт через него. Владелец G3; потребитель G4 (`finishImport`, статус 3.6).
- **K6 Язык выдачи GIF** — функции `sources/gifs.ts` принимают `locale: Locale` аргументом; GIPHY `lang` только в
  `search`, KLIPY `locale=ru_RU|en_US` в `search` и `featured`; `useGifFeed` передаёт `getLocale()`. Владелец G4.
- **K7 Источник языка** — `AMO_LOCALE_KEY = 'i18nextLng'`, `setLocale(readAmoLocale())` — первая строка `start()`;
  переключатель стенда пишет тот же ключ. Владелец G1; потребитель G7.

## Группы

### G1 · Модуль языка и словари · M · волна 1

- Задачи: 1.1, 2.1, 2.2, 2.3
- Зависит от: —
- Файлы: `src/core/i18n/**`, `src/core/app.ts`, `tests/locale.test.ts`, `tests/translate.test.ts`, `package.json`,
  `src/extension/manifest.json` (версия), `build.mjs` (`@version`)
- Требования: `localization` → «Язык интерфейса по языку amo»
- Design: «Язык: localStorage.i18nextLng…», «Словари — модули TS», «Язык — состояние модуля»
- Контракты: вводит K1, K2, K3, K7
- Усиление проверок: 1.1 — ветка переименованием `git branch -m` (worktree, без switch), база = `origin/master`;
  2.1 — кейс `readAmoLocale` со значением в `localStorage` (не только бросающее хранилище)

### G2 · Каркас пикера и формы · M · волна 2

- Задачи: 3.1, 3.2, 3.5
- Зависит от: G1
- Файлы: `src/core/ui/renderMessage/**`, `ui/Picker/{Picker.tsx,Footer/**,Screen/Screen.tsx,AddView/**}`,
  `ui/Picker/SectionTabs/{SectionTabs.tsx,AddButton/**}`, `ui/Picker/StickerFeed/CreateTile/**`,
  `ui/Picker/SettingsView/SettingsView.tsx`, `src/core/i18n/messages.*.ts`, `tests/renderMessage.test.ts`
- Требования: `localization` → «Охват перевода»
- Design: «Словари — модули TS» (`renderMessage`, `{link}`), «Глоссарий»
- Контракты: потребляет K1, K2
- Усиление проверок: 3.2, 3.5 — `rg` по кириллице вне комментариев в файлах группы пуст; стенд с `i18nextLng=en-US`

### G7 · Метаданные сборок и стенд · S · волна 2

- Задачи: 6.1, 6.2, 7.1
- Зависит от: G1
- Файлы: `src/extension/manifest.json`, `src/extension/_locales/**`, `build.mjs`, `tests/userscriptBanner.test.ts`,
  `tests/extensionLocales.test.ts`, `dev/harness.html`
- Требования: `runtime-hosts` → «Метаданные на двух языках»
- Design: «Метаданные сборок»
- Контракты: потребляет K7
- Усиление проверок: 6.1 — юнит-тест: `default_locale: "ru"`, `description` = `__MSG_extDescription__`, оба
  `messages.json` с непустым `extDescription`, `build.mjs` копирует `_locales`

### G3 · Режим «Стикеры» · M · волна 3

- Задачи: 3.3
- Зависит от: G2
- Файлы: `ui/Picker/packTitle/**`, `ui/Picker/StickersMode/feedSections/**`, `ui/Picker/PackCover/**`,
  `ui/Picker/SectionHeader/**`, `ui/Picker/cellName/**`, `ui/Picker/StickerCell/**`, `ui/Picker/MasonryGrid/MasonryCell/**`,
  `ui/Picker/Menu/CellMenu/**`, `ui/Picker/PickerProvider/finishImport/**`, `src/core/db.ts`, `messages.*.ts`,
  `tests/{feedSections,cellName,finishImport,coverLetters,packTitle}.test.ts`
- Требования: `localization` → «Раздел своих стикеров на языке интерфейса», «Охват перевода»
- Design: «„Мои стикеры“ — по id пака»
- Контракты: вводит K5
- Усиление проверок: 3.3 — юнит `packTitle`: `custom` с `title: 'Мои стикеры'` на `en` → «My stickers», пак `tg:` —
  своё название; `rg` по кириллице в файлах группы пуст (`db.ts` `ensureCustomPack` — через `t`, задачи на него нет)

### G4 · Режим «GIF», статусы, язык выдачи · M · волна 4

- Задачи: 3.4, 3.6, 5.1
- Зависит от: G3
- Файлы: `ui/Picker/GifView/**`, `ui/Picker/useGifFeed/**`, `ui/Picker/PickerProvider/{usePickerState.ts,finishImport/**}`,
  `ui/Picker/useStickerDraft/**`, `ui/Picker/SettingsView/useSettingsDraft/**`, `src/core/sources/gifs.ts`,
  `messages.*.ts`, `tests/{gifSections,gifs,finishImport}.test.ts`
- Требования: `localization` → «Охват перевода»; `gif-search` → «Язык выдачи»
- Design: «Язык поиска GIF»
- Контракты: вводит K6; потребляет K5
- Усиление проверок: 5.1 — `rg 'getLocale' src/core/ui/Picker/useGifFeed` находит передачу в запрос; 3.6 — `rg` по
  кириллице в файлах группы пуст

### G5 · Ошибки ядра в мире страницы · M · волна 5

- Задачи: 4.1
- Зависит от: G4
- Файлы: `src/core/{sender,app,convert,tgs}.ts`, `src/core/sources/{telegram,gifs}.ts`, `messages.*.ts`,
  `tests/{sender,telegram,tgs,gifs}.test.ts`
- Требования: `localization` → «Ошибки на языке интерфейса»
- Design: «Ошибки: текст при создании…»
- Контракты: потребляет K1
- Усиление проверок: 4.1 — кейс `en` проверяет конкретный английский текст, а не «не русский»

### G6 · Сетевые ошибки и граница SW · M · волна 6

- Задачи: 4.2, 4.3, 4.4
- Зависит от: G5
- Файлы: `src/core/net.ts`, `src/extension/{background,content}.ts`, `src/extension/messages.types.ts`,
  `src/extension/fetchResponse*.ts`, `src/userscript/gmNetwork.ts`, `messages.*.ts`,
  `tests/{net,background,gmNetwork,fetchResponse}.test.ts`
- Требования: `localization` → «Ошибки на языке интерфейса»
- Design: «Ошибки: текст при создании, ключ — через границу service worker»
- Контракты: вводит K4; потребляет K3
- Усиление проверок: 4.3 — тест зовёт ту же функцию разбора, что импортирует `content.ts`, не копию; 4.2 — число МБ
  в тексте `en` равно лимиту вызова

### G8 · Остатки, раскладка, документация · S · волна 7

- Задачи: 4.5, 7.2, 7.4
- Зависит от: G6, G7
- Файлы: `CLAUDE.md`, правки раскладки в `src/core/ui/Picker/**` по итогам 7.2
- Требования: `localization` → «Охват перевода»
- Design: Risks («Новая строка литералом мимо словаря», «Английский текст длиннее русского»)
- Контракты: проверяет K1–K7 поиском
- Усиление проверок: 7.2 — скриншоты ru/en × светлая/тёмная, каждый элемент из списка задачи виден целиком

### G9 · Живой amo · S · волна 8

- Задачи: 7.3
- Зависит от: G8
- Файлы: — (сборка в `local/`, без правок продукта)
- Требования: `localization` → «Имя файла и стиль сообщений не зависят от языка», «Ошибки на языке интерфейса»
- Design: «Язык поиска GIF»
- Контракты: проверяет K4, K6, K7 в живой среде

## Волны

1. G1
2. G2, G7 — G7 не трогает словарь и UI, `manifest.json`/`build.mjs` G1 уже отпустила
3. G3
4. G4
5. G5
6. G6
7. G8
8. G9
