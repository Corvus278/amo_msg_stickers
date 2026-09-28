# План прогона: english-user-docs

База прогона: `0d6f9cba8f6cad44e4c4374e4897e530801c6662`
Гейт: `pnpm lint && pnpm test && pnpm build && pnpm docs:build`
Быстрые проверки: `pnpm typecheck` (корень и `docs/tsconfig.json`), `pnpm exec vitest --project=unit --run tests/userDocs.test.ts`
Долгие слои: `pnpm docs:build` — G2, G3 (с оговоркой о соседе), G4, G5; `pnpm docs:preview` — G5
Pre-commit: lint-staged + `pnpm typecheck` + `vitest --changed` — каждая группа оставляет их зелёными.

## Контракты

- **K1 Набор страниц** — `docs/content/en/` зеркалит русские пути: `index`, `install/{index,chromium,firefox,safari,
  desktop}`, `setup/{gif-keys,telegram}`, `update`, `faq`, `privacy` + `_parts/en/userscript.md`. Владельцы G2, G3; потребители G1, G4.
- **K2 Названия разделов** — `text` в `locales.en` sidebar/nav = H1 английской страницы: Installation, Setup, Help;
  “Chrome, Edge, Yandex Browser, Opera”, Firefox, Safari, “amo app”, “GIF keys”, “Import from Telegram”, Updating,
  FAQ, “Privacy policy”. Владелец G1; потребители G2, G3.
- **K3 Ссылки и якоря** — внутренние ссылки en-страниц относительные, как в русском оригинале (остаются внутри `en/`);
  якоря `{#archive}` (update), `{#pack-link}` (setup/telegram), `{#limits}` (setup/gif-keys) сохраняются. Владелец G3; потребитель G2.
- **K4 Картинки** — те же файлы `docs/content/img/**` на уровень глубже (`../img/`→`../../img/`, `./img/`|`img/`→`../img/`),
  копий нет; `alt`/`aria-label` по-английски. Оговорка «скрины с русским интерфейсом» — только в `en/index.md`. G2, G3.
- **K5 Язык ссылки на доку** — `userDocsUrl(page: UserDocsPage, locale: Locale)`, префиксы `Record<Locale, string>`
  (`ru: ''`, `en: 'en/'`); префикс `en` = `locales.en.link` `'/en/'` в `config.mts` (сверяет тест). Владелец G4 (конфиг — G1).
- **K6 Язык страницы** — выбор английского по началу тега `en` (`useData().lang` в `CopyCode.vue`, `lang: 'en-US'` локали). Владелец G1.
- **K7 Названия интерфейса** — в английском тексте экраны/кнопки/поля amo stickers — строки `src/core/i18n/messages.en.ts`
  (читать, не править). Потребители G2, G3.

## Группы

### G1 · Каркас английской локали сайта · S · волна 1

- Задачи: 1.1, 1.2
- Зависит от: —
- Файлы: `docs/.vitepress/config.mts`, `docs/.vitepress/theme/CopyCode.vue`
- Требования: `user-docs` → «Сайт доки», «Адреса страниц браузера»
- Design: «Конфиг», «`CopyCode.vue` по языку страницы»
- Контракты: вводит K2, K6; конфиг-часть K5 (`link: '/en/'`)
- Усиление проверок: 1.1 — русские подписи переезжают в `locales.root` без изменения текста (дифф строк: только
  перенос); `docs:build` 1.1 проверяет G4. 1.2 — `pnpm typecheck` зелёный.

### G2 · Перевод: главная и установка · M · волна 1

- Задачи: 2.1
- Зависит от: —
- Файлы: `docs/content/en/index.md`, `docs/content/en/install/**`, `docs/content/_parts/en/userscript.md`
- Требования: `user-docs` → «Сайт доки», «Адреса страниц браузера»
- Design: «Локаль VitePress `en`…», «Фрагмент userscript на английском», «Картинки и видео», «Названия интерфейса», «Типографика»
- Контракты: K1, K3, K4, K7; следует K2
- Усиление проверок: `pnpm docs:build` — допустимы только битые ссылки на страницы G3 (`en/setup/*`, `en/update`,
  `en/faq`, `en/privacy`); каждая картинка/видео en-страницы резолвится в существующий файл (`rg` путей + `ls`);
  `::::tabs`, `<CopyCode>`, `<!--@include: ../_parts/en/userscript.md-->` — в тех же местах, что в русских; кириллицы в `en/**` нет.

### G3 · Перевод: настройка, обновление, FAQ, приватность · M · волна 1

- Задачи: 2.2, 2.3
- Зависит от: —
- Файлы: `docs/content/en/setup/**`, `docs/content/en/{update,faq,privacy}.md`
- Требования: `user-docs` → «Сайт доки»
- Design: «Картинки и видео», «Названия интерфейса», «Типографика»
- Контракты: вводит K3 (якоря); K1, K4, K7; следует K2
- Усиление проверок: `pnpm docs:build` — допустимы только битые ссылки на страницы G2; «все 11 страниц в
  `dist/en/`» из 2.3 проверяет G4; кириллицы в своих файлах нет; все картинки резолвятся.

### G4 · Ссылки из интерфейса по языку и тесты · M · волна 2

- Задачи: 3.1, 3.2, 3.3
- Зависит от: G1, G2, G3 (тесты 3.3 читают `en/**` и `config.mts`)
- Файлы: `src/core/userDocs*.ts`, `src/core/i18n/messages.en.ts`, `src/core/ui/Picker/{SettingsView,GifView}/**`,
  `src/core/ui/Picker/AddView/TelegramImport/**`, `tests/userDocs.test.ts`, `tests/userDocsPages.test.ts` (новый);
  при битых ссылках из `docs:build` — точечно `docs/content/en/**`
- Требования: `runtime-hosts` → «Подсказки настроек»; `gif-search` → «Доступные источники»; `telegram-import` → «Подсказка импорта»
- Design: «Ссылки из интерфейса — по языку интерфейса», «Проверки»
- Контракты: вводит K5
- Усиление проверок: 3.3 — эталон адреса литералом (`https://mcar2107.github.io/amo_msg_stickers/en/setup/gif-keys`),
  не через `USER_DOCS_URL`+префикс; тест пар падает при удалении любого `en/*.md` (проверить временным удалением);
  `rg 'GIF_KEYS_DOCS_URL|TELEGRAM_DOCS_URL' src tests` пусто; `userDocsUrl` зовётся в рендере с `getLocale()` в трёх
  компонентах (`rg`); `rg 'in Russian' src` пусто. Выполняет отложенные проверки 1.1 и 2.3: `pnpm docs:build` зелёный,
  в `docs/.vitepress/dist/en/` 11 страниц.

### G5 · README, заметки разработчика, версия, итог · S · волна 3

- Задачи: 4.1, 4.2, 4.3, 5.1
- Зависит от: G1–G4
- Файлы: `README.md`, `CLAUDE.md`, `docs/README.md`, `package.json`, `src/extension/manifest.json`, `build.mjs`
- Требования: `user-docs` → «README как вход в доку»
- Design: «Версия — 0.14.0», Risks («правило: правка страницы — в обоих языках»)
- Контракты: описывает K1, K4, K5 в `CLAUDE.md`/`docs/README.md`
- Усиление проверок: 4.3 — `pnpm test` (version.test) и `node scripts/check-version.mjs --base origin/master`.
  5.1 без кликов: в `dist/install/firefox.html` ссылка переключателя на `/amo_msg_stickers/en/install/firefox` и обратно;
  отдельный индекс локального поиска `en` в `dist/assets` без кириллических заголовков; «Copied» — в бандле темы;
  клик `CopyCode` — через headless Chrome на `docs:preview`, если доступен, иначе — в журнал.

## Волны

1. G1, G2, G3 — файлы не пересекаются; `docs:build` групп терпит битые ссылки только на соседа
2. G4 — тесты пар страниц и конфига требуют всех en-страниц и локали
3. G5 — CLAUDE.md описывает итоговое устройство, итоговый гейт
