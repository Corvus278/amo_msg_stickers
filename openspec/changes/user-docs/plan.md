# План прогона: user-docs

База прогона: `3ca6b8f1697e6bc793f0ce607720a38d010147be`
Гейт: `pnpm lint && pnpm test && pnpm build && pnpm docs:build` (`docs:build` — начиная с G1)
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest run tests/<файл>.test.ts`, `pnpm docs:build`
Долгие слои: стенд `dev/harness.html` (chrome-devtools, `ru` и `en`, обе темы) — группы G3, G6

## Контракты

- **K1 Страницы доки** — `docs/{index,update,faq,privacy}.md`, `docs/install/{index,chromium,firefox,safari,desktop}.md`,
  `docs/setup/{gif-keys,telegram}.md`, фрагмент `docs/_parts/userscript.md` (в `srcExclude`). Владелец G1; G3, G4, G5.
- **K2 Адрес доки** — `https://mcar2107.github.io/amo_msg_stickers/` = `base: '/amo_msg_stickers/'` + `cleanUrls`:
  адрес страницы — база + slug без `.md` (`setup/gif-keys`). Владелец G1 (config.mts); потребитель G3 (`userDocs.ts`).
- **K3 Скрипты и установка доки** — корневые `docs:dev|docs:build|docs:preview` = `pnpm -C docs …`;
  `.github/actions/setup` ставит `pnpm -C docs install --frozen-lockfile`. После G1 любой worktree перед коммитом
  делает `pnpm -C docs i`: хук гоняет `pnpm typecheck` по `docs/tsconfig.json`. Владелец G1; потребители G2, G6.
- **K4 Файлы релиза** — `…/releases/latest/download/amo-stickers.zip` и `…/amo-stickers.user.js`
  (`https://github.com/mcar2107/amo_msg_stickers`); `@updateURL` = `@downloadURL` = адрес user.js. Владелец G2;
  потребители G4, G5 (`update.md`), G6 (README).
- **K5 Место скрина** — `<!-- скрин: img/<раздел>/<имя>.png — что на нём -->`, без `![](…)` на несуществующий файл.
  Владелец G4; потребители G5, G6.
- **K6 Путь к ссылке на пак в Telegram** — фраза пути по меню из `docs/setup/telegram.md` дословно (ru) и её перевод
  (en) в `add.telegram.hint`. Владелец G5; потребитель G3.
- **K7 Ссылка на доку в словаре** — подстановка `{docs}` рядом с `{link}`, текст ссылки — ключ словаря; en — «(in
  Russian)». Владелец G3; потребитель G6 (typograf не трогает `{docs}`/`{link}`).

## Группы

### G1 · Каркас сайта доки · M · волна 1

- Задачи: 1.1, 1.2, 1.3
- Зависит от: —
- Файлы: `docs/**` (package.json, pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.json, .vitepress/**, заглушки страниц),
  `package.json` (скрипты, typecheck), `.github/actions/setup/**`, `.gitignore`, `.prettierignore`, `eslint.config.mjs`
- Требования: `user-docs` → «Сайт доки», «Разделы доки»
- Design: «Дока — отдельный пакет», «Конфиг VitePress», «Вкладки установки», «Структура страниц»
- Контракты: вводит K1, K2, K3
- Усиление проверок: 1.1 — `rg vitepress pnpm-lock.yaml` пуст после корневого `pnpm i`; 1.2 — `pnpm exec eslint
  docs/.vitepress/config.mts` с временной ошибкой падает (файл не игнорируется); 1.3 — временная битая ссылка
  валит `pnpm docs:build`, в `docs/.vitepress/dist` нет `_parts`

### G2 · Автообновление userscript и CI · M · волна 1

- Задачи: 2.1, 2.2, 6.1, 6.2
- Зависит от: — (ссылается на `pnpm docs:build` и setup из K3)
- Файлы: `build.mjs` (баннер), `tests/userscriptBanner.test.ts`, `.github/workflows/{ci,release,pages}.yml`
- Требования: `runtime-hosts` → «Автообновление userscript»; `ci-cd` → «Проверки PR», «Релиз после мержа в master»,
  «Публикация доки»
- Design: «Автообновление userscript», «Постоянное имя архива», «Публикация — pages.yml»
- Контракты: вводит K4; потребляет K3
- Усиление проверок: 2.1 — `pnpm build` → директивы в `dist/amo-stickers.user.js`, `pnpm watch` (одна сборка) → нет;
  тест требует директивы внутри ветки `!isWatch`, а не просто в тексте; 2.2 — `rg 'amo-stickers-\$' .github` пуст,
  имя в upload `ci.yml` и в attach `release.yml` одно; 6.2 — триггеры, `paths`, `permissions`, `concurrency` сверены
  с design построчно

### G4 · Тексты доки: главная и установка · M · волна 2

- Задачи: 4.1, 4.2, 4.3
- Зависит от: G1, G2
- Файлы: `docs/index.md`, `docs/install/**`, `docs/_parts/**`
- Требования: `user-docs` → «Установка по окружениям», «Разделы доки»
- Design: «Структура страниц», «Менеджеры userscript», «Постоянное имя архива»
- Контракты: вводит K5; потребляет K1, K4
- Усиление проверок: 4.2 — ссылки на архив и user.js ровно по K4; 4.3 — `rg 'без гарантий' docs/install` находит
  Safari и Violentmonkey, рядом ссылка на проверенный способ; названия пунктов браузеров — по источникам из сети

### G5 · Тексты доки: настройка, обновление, FAQ, политика · M · волна 2

- Задачи: 4.4, 4.5, 4.6
- Зависит от: G1, G2
- Файлы: `docs/setup/**`, `docs/update.md`, `docs/faq.md`, `docs/privacy.md`
- Требования: `user-docs` → «Настройка ключей GIF», «Импорт из Telegram», «Политика конфиденциальности»
- Design: «Автообновление userscript», «Постоянное имя архива»
- Контракты: вводит K6; потребляет K1, K4, K5
- Усиление проверок: 4.6 — каждый пункт требования «Политика конфиденциальности» сверен с текстом (IndexedDB и
  `localStorage` amo, хранилище менеджера и без него); 4.5 — лимит KLIPY с источником, иначе явный вопрос в отчёте

### G3 · Подсказки в интерфейсе · M · волна 3

- Задачи: 3.1, 3.2, 3.3, 3.4, 3.5
- Зависит от: G1 (страницы для теста), G5 (K6)
- Файлы: `src/core/userDocs.ts`, `tests/userDocs.test.ts`, `src/core/ui/Picker/{ExternalLink,SettingsView,GifView}/**`,
  `src/core/ui/Picker/AddView/TelegramImport/**`, `src/core/i18n/messages.{ru,en}.ts`
- Требования: `runtime-hosts` → «Настройки», «Подсказки настроек»; `gif-search` → «Доступные источники»;
  `telegram-import` → «Подсказка импорта»
- Design: «Адрес доки в ядре», «Подсказки в интерфейсе»
- Контракты: вводит K7; потребляет K1, K2, K6
- Усиление проверок: 3.1 — тест перебирает страницы из экспорта модуля, а не свой список, и сверяет базу с `base`
  из `docs/.vitepress/config.mts`; 3.3 — тест: у `settings.*.hint`, `gifs.*`, `add.telegram.hint` набор подстановок
  en = ru; 3.3–3.5 — на стенде `target="_blank"`, адреса ссылок, порядок KLIPY → GIPHY → токен, оба языка

### G6 · Полировка текстов, README, версия, финал · M · волна 4

- Задачи: 4.7, 4.8, 5.1, 7.1, 7.2, 7.3
- Зависит от: G1, G2, G3, G4, G5
- Файлы: `docs/**/*.md`, `src/core/i18n/messages.{ru,en}.ts`, `README.md`, `CLAUDE.md`, `package.json` (version),
  `src/extension/manifest.json`, `build.mjs` (`@version`)
- Требования: `user-docs` → «README как вход в доку», «Разделы доки»; `ci-cd` → «Проверки PR» (версия)
- Design: «Места под скрины», «Тексты», «README»
- Контракты: потребляет K3, K4, K5, K7
- Усиление проверок: 4.7 — список скринов для PR в отчёте, число строк = `rg -c 'скрин:' docs`; 4.8 — после typograf
  `{docs}`/`{link}` целы, `pnpm test` зелёный; 7.2 — `rg 'amo-stickers-(<|\$)' -g '!openspec/changes/archive'` пуст

## Волны

1. G1, G2 — файлы не пересекаются (`package.json` только у G1, `build.mjs` только у G2)
2. G4, G5 — разные страницы `docs/`
3. G3 — ждёт путь Telegram из G5 (K6)
4. G6
