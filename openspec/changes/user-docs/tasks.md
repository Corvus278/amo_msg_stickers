## 1. Каркас сайта доки

- [x] 1.1 Завести `docs/` отдельным пакетом по design.md: `docs/package.json` с `vitepress` и `vitepress-plugin-tabs`
  (сверить совместимость версий плагина и VitePress), `docs/pnpm-workspace.yaml` (`allowBuilds` для esbuild),
  `docs/pnpm-lock.yaml`; в корневом `package.json` — скрипты `docs:dev`, `docs:build`, `docs:preview` через
  `pnpm -C docs`; `.github/actions/setup` ставит и зависимости доки, ключ кэша — по обоим lockfile; проверка —
  `pnpm -C docs i` ставит зависимости, после корневого `pnpm i` в корневом `pnpm-lock.yaml` нет `vitepress`
  (`git diff pnpm-lock.yaml` пуст); иначе — запасной вариант из design.md «Risks»
- [x] 1.2 Создать `docs/.vitepress/config.mts` по design.md (`base`, `lang`, `cleanUrls`, локальный поиск, `locales`
  с `root`, `srcExclude` для `_parts/**`, навигация и сайдбар по структуре страниц, `tabsMarkdownPlugin`) и
  `docs/.vitepress/theme/index.ts` (тема по умолчанию + `enhanceAppWithTabs`); `docs/tsconfig.json` на оба файла,
  `typecheck` проверяет корневой и `docs/tsconfig.json`; кэш и сборку VitePress — в `.gitignore`, `.prettierignore`,
  `ignores` eslint; проверка — `pnpm lint` чистый и видит файлы `docs/.vitepress/`, `pnpm docs:build` собирает сайт из
  заглушки `docs/index.md`, вкладки `:::tabs` на заглушке рендерятся
- [x] 1.3 Завести все страницы структуры из design.md заголовками и заглушками, сайдбар ведёт на каждую; фрагмент
  `_parts/userscript.md` подключён `@include`; проверка — `pnpm docs:build` без битых ссылок, в сборке нет страницы
  `_parts/userscript`, `pnpm docs:dev` показывает навигацию, поиск и переключение темы

## 2. Автообновление userscript и имя архива

- [x] 2.1 Добавить `@updateURL` и `@downloadURL` в `USERSCRIPT_BANNER` только для боевой сборки; тест в
  `tests/userscriptBanner.test.ts` — обе директивы с адресом последнего релиза; проверка — `pnpm test`, в
  `dist/amo-stickers.user.js` после `pnpm build` директивы есть, после `pnpm watch` — нет
- [x] 2.2 Переименовать архив расширения в `amo-stickers.zip` в `ci.yml` и `release.yml`; проверка — артефакт `build`
  прогона PR содержит `amo-stickers.zip`

## 3. Подсказки в интерфейсе

- [ ] 3.1 Создать `src/core/userDocs.ts` (базовый адрес доки, страницы `setup/gif-keys` и `setup/telegram`, сборка
  адреса страницы) и тест: для каждой страницы модуля есть `docs/<страница>.md`; проверка — `pnpm test`
- [ ] 3.2 Перенести `ExternalLink` из `SettingsView/` в `Picker/ExternalLink/`; проверка — `pnpm lint`, ссылки в
  настройках открываются в новой вкладке на стенде
- [ ] 3.3 Настройки: порядок полей KLIPY → GIPHY → токен, ссылка KLIPY на `partner.klipy.com/api-keys`, ссылки на доку
  у ключей GIF и токена (строки словаря ru и en с подстановкой `{docs}`, английский текст ссылки — «на русском»);
  проверка — на стенде с `ru` и `en` подсказки на своём языке, ссылки ведут на Partner Panel, `setup/gif-keys`,
  `setup/telegram`
- [ ] 3.4 Режим «GIF» без ключей: ссылка на `setup/gif-keys` под «Открыть настройки» (ru и en); проверка — на стенде
  без ключей ссылка открывает страницу доки в новой вкладке, «Открыть настройки» работает как раньше
- [ ] 3.5 Импорт из Telegram: к подсказке о конвертируемых стикерах добавить «где взять ссылку на пак» и ссылку на
  `setup/telegram` (ru и en; путь по меню — тот же, что в доке после 4.4); проверка — на стенде экран «Добавить
  стикеры» показывает подсказку целиком и ссылку

## 4. Тексты доки

- [x] 4.1 `index.md` (что это, возможности, «Установить» на `install/`) и `install/index.md` (выбор окружения:
  Chromium, Firefox, Safari, десктоп); проверка — с главной за два клика попадаешь на страницу своего браузера
- [x] 4.2 `install/chromium.md` — вкладки «Chrome Web Store» (до #51 — «на проверке», путь к двум другим), «Архив»
  (прямая ссылка на `amo-stickers.zip`, режим разработчика, обновление — очистить папку, распаковать туда же,
  «Обновить»; нет автообновления, другая папка — сброс ключей), «Userscript» (Tampermonkey и шаг «Разрешить
  пользовательские скрипты» в Chrome, установка в один клик, разрешения менеджера; Violentmonkey — «без гарантий»);
  общий фрагмент `_parts/userscript.md` для Firefox и Safari; сверить названия пунктов в текущих Chrome, Edge,
  Яндекс Браузере, Opera; проверка — в чистом профиле Chrome по тексту ставятся архив и userscript через Tampermonkey
  (окно установки открывается по ссылке из доки)
- [x] 4.3 `install/firefox.md` (Tampermonkey; Violentmonkey — «без гарантий»), `install/safari.md` (Userscripts —
  «без гарантий», настройки могут лежать в хранилище сайта amo), `install/desktop.md` («пока недоступно»); проверка —
  `pnpm docs:build`, на десктоп-странице нет инструкций, у способов без гарантий есть пометка и путь к проверенному
- [x] 4.4 `setup/telegram.md`: @BotFather → токен → «Настройки» → ссылка на пак (сверить путь в Telegram на
  десктопе, в вебе и на телефоне) → импорт; предупреждение о секретности токена; проверка — импорт пака по тексту
  с нуля
- [x] 4.5 `setup/gif-keys.md`: KLIPY (рекомендуем за выбор контента, `partner.klipy.com/api-keys`), затем GIPHY
  (`developers.giphy.com/dashboard`); лимиты тестовых ключей (GIPHY — 100 запросов в час, KLIPY — сверить в Partner
  Panel) и что их тратит; без обещаний боевых ключей; проверка — ключ KLIPY получен и вставлен по тексту, поиск
  работает, цифра лимита KLIPY совпадает с Partner Panel
- [x] 4.6 `update.md` (расширение, архив, userscript; разовая переустановка userscript без `@updateURL`), `faq.md`
  (нет кнопки, скрипт не запускается в Tampermonkey, не работает в менеджере без гарантий, «Не понял ссылку», упёрся
  в лимит, ключи пропали после смены папки архива), `privacy.md` (хранимые данные, в том числе без хранилища
  менеджера; сторонние сервисы и загрузка с их серверов; отправленный стикер — в amo; разработчику — ничего);
  проверка — `pnpm docs:build`, `privacy.md` покрывает все пункты требования «Политика конфиденциальности»
- [ ] 4.7 Отметить места скринов комментариями `<!-- скрин: … -->` во всех страницах и собрать их список для автора
  в описание PR; проверка — `rg 'скрин:' docs` совпадает со списком
- [ ] 4.8 Прогнать тексты доки и новые строки словаря через скилл `typograf` — символами Unicode, без HTML-сущностей;
  проверка — диф без изменения смысла, `rg '&nbsp;|&laquo;|&mdash;' docs src/core/i18n` пуст

## 5. README

- [ ] 5.1 Переписать README по design.md: пользовательская часть сверху (фраза, место под демо, возможности,
  «Установить» на доку, прямые ссылки на архив и userscript), «Разработка» ниже; typograf; проверка — на GitHub
  первый экран README ведёт на установку, ссылки открываются

## 6. CI и публикация

- [x] 6.1 Задание `docs` (`pnpm docs:build`) в `ci.yml`; проверка — в PR шесть отдельных статусов, `docs` зелёный
- [x] 6.2 `.github/workflows/pages.yml` по design.md; проверка — сборка в нём — та же команда, что в задании `docs`,
  триггеры и `permissions` совпадают с design.md; деплой проверяется после мержа («Migration Plan»)
- [ ] 6.3 Попросить автора включить Pages в настройках репозитория (Source: GitHub Actions) до мержа; проверка —
  настройка включена

## 7. Версия, документация проекта, проверка

- [ ] 7.1 Поднять версию до `0.13.0` в `package.json`, `manifest.json` и `@version` в `build.mjs`; проверка —
  `node scripts/check-version.mjs --base origin/master` зелёный
- [ ] 7.2 Обновить `CLAUDE.md`: `docs/` — отдельный пакет со своим lockfile, `userDocs.ts` в структуре, команды
  `docs:*`, `typecheck` двух проектов, установка доки в `.github/actions/setup`, `pages.yml` и задание `docs` в «CI и
  релизы», имя архива, `ExternalLink` в общем каталоге; проверка — упоминаний архива с версией не осталось
  (`rg 'amo-stickers-(<|\$)'` пуст)
- [ ] 7.3 Финальная проверка: `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm docs:build`; на стенде обе темы и оба
  языка — подсказки и ссылки по specs; все зелёные
