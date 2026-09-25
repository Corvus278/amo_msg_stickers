# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Что это

amo stickers — стикеры и GIF для мессенджера amo (web). В строке ввода рядом с кнопкой эмодзи появляется
кнопка стикеров, по клику открывается пикер: недавние, поиск GIF (GIPHY, KLIPY), паки, импортированные из Telegram, и
свои стикеры из картинки, GIF, видео или `.tgs` с подписью. Стикер отправляется кликом.

Публичного API для отправки сообщений у amo нет, поэтому код живёт внутри чужой страницы и отправляет стикер штатным
путём пользователя: вставкой файла в поле ввода и кликом «Отправить».

## Стек и сборка

TypeScript (strict) + esbuild. UI пикера — Preact (JSX с `jsxImportSource: 'preact'`, классы по варианту и состоянию
описывает `cva` из `class-variance-authority`), стили — Tailwind 3 с токенами amo в `tailwind.config.ts`: цвета, шрифты,
тени и шкала отступов совпадают с tailwind-классами страницы amo, поэтому класс из её вёрстки значит в пикере то же
самое. GIF кодирует `gifenc` — потоково, в Web Worker-е, `.tgs` рендерит `lottie-web` (light canvas-плеер: без
`eval`, который не пропускает CSP расширения). Пакетный менеджер — pnpm, версии Node и pnpm — в `.mise.toml`.

```bash
pnpm i
pnpm build             # dist/extension/* и dist/amo-stickers.user.js
pnpm watch             # пересборка при изменениях, с inline-sourcemap и адресами localhost:3000
pnpm typecheck         # только проверка типов (TS 7)
pnpm lint              # eslint + typecheck + prettier --check параллельно
pnpm lint:fix          # eslint --fix
pnpm format            # prettier --write
pnpm test              # vitest, проект `unit`
pnpm skills:update     # openspec update: перегенерация .claude/skills/openspec-* и .claude/commands/opsx
```

Одно ядро (`src/core`) собирается в две цели (`build.mjs`, формат IIFE, `target: chrome120`):

- **расширение** Chrome / Яндекс / Edge (MV3): content script + service worker, `dist/extension/`;
- **userscript** для Tampermonkey и других менеджеров: `dist/amo-stickers.user.js` с заголовком `==UserScript==`.

У сборки два esbuild-плагина: `tailwind` отдаёт ядру CSS пикера строкой, `gif-worker` — код Worker-а кодирования GIF
(«Сборка CSS и Worker-а»).

Различия целей спрятаны за интерфейсом `Host` (`core/host.ts`): сеть и хранение настроек. Расширение ходит в сеть
через service worker — обход CORS; userscript — прямым `fetch` со страницы, под её CORS. Настройки: у
расширения `chrome.storage.local`, у userscript `localStorage`.

Боевая сборка запускается только на `https://*.amo.tm/*`; `http://localhost:3000/*` и `http://127.0.0.1:3000/*`
`build.mjs` добавляет в manifest и в заголовок userscript лишь в `pnpm watch`.

TypeScript в проекте двух версий: `typescript-native` (7.x, нативный tsgo) проверяет типы, `typescript` (6.x) нужен
только typescript-eslint, который TS 7 пока не поддерживает. `node_modules/.bin/tsc` занят одной из них — проверку
типов запускай через `pnpm typecheck`.

## Структура

```
build.mjs package.json tsconfig.json vitest.config.ts               # сборка двух целей (+ CSS, Worker), конфиги
eslint.config.mjs .prettierrc .prettierignore .editorconfig          # линтеры
.lintstagedrc.mjs .husky/pre-commit                                  # гейт коммита
src/
  core/
    app.ts           старт: поиск полей ввода MutationObserver-ом, кнопка рядом с эмодзи, открытие пикера, отправка
    amoDom.ts        всё знание о DOM amo: селекторы поля ввода, эмодзи, «Отправить», отмены редактирования, темы
    sender.ts        отправка файла: paste → ожидание вложения → клик «Отправить», проверки черновика
    convert.ts       любой источник (картинка, GIF, видео, .tgs) → GIF: пробный и полные проходы, подпись, GIF как есть
    sidePick.ts      выбор стороны по весу пробных кадров: ряд сторон, `MAX_GIF_BYTES`, `SAMPLE_FRAMES`, `SAFETY`
    encodeLadder.ts  лестница проходов: старт по пробе, повтор меньшей стороной, пока GIF тяжелее 2 МБ
    frameSource*.ts  источники кадров: план (позиция, задержка) и отрисовка кадра по номеру — видео, `.tgs`, картинка
    gifEncoder.ts    потоковый кодировщик GIF без DOM: палитра, дизеринг, сжатие кадра сразу при записи
    frameSink*.ts    приёмник кадров прохода: `frameSink.ts` — фабрика, `frameSinkMain.ts` — фолбэк на главном потоке
    workerSink*.ts   приёмник с кодированием в Worker-е: запуск из blob URL, окно кадров, переход на фолбэк
    gifWorker*.ts    Worker кодирования: протокол сообщений (`gifWorker.ts`) и точка входа бандла (`gifWorkerEntry.ts`)
    db.ts            IndexedDB: паки, стикеры, недавние
    host.ts          интерфейс окружения (`Host`) и настройки (ключи GIPHY/KLIPY, токен Telegram-бота)
    net.ts           сетевая политика: разрешённые хосты, fetch с проверкой, чтение потока с лимитом
    gif.ts           проверка GIF по блочной структуре (`inspectGif`)
    tgs.ts           распаковка `.tgs` с лимитом и проверкой Lottie
    guards.ts        общий первый шаг гардов ответов API (`isObject`)
    sources/         gifs.ts — поиск GIPHY и KLIPY; telegram.ts — импорт пака через Bot API
    ui/
      createPicker.tsx  фасад пикера для `app.ts`: shadow root, `open`/`close`/`setTheme`, рендер Preact-дерева
      picker.css        вход Tailwind: base/components/utilities и сброс наследования `:host`
      icons.ts          `stickerIcon` — svg-строка кнопки стикеров в DOM amo
      Picker/           компоненты и хуки пикера, каждый в своём каталоге:
                        Picker.tsx — панель; PickerProvider/ — контекст (окружение, настройки, паки, статус,
                        отправка, object URL, импорт из Telegram); Tabs/, Tab/, TabIcon/, TabSvg/ — вкладки;
                        RecentView/, GifView/, PackView/, AddView/, SettingsView/ — представления, ViewHeader/ и
                        ViewBody/ — их шапка и тело; Button/, TextInput/, EmptyState/, StatusBar/ — примитивы;
                        StickerGrid/, StickerCell/, MasonryGrid/ — сетки, cellName/ — имена ячеек для скринридера,
                        useCellSend/ — отправка из ячейки; use*/ — хуки
  extension/      content.ts (Host расширения), background.ts (service worker: fetch в обход CORS),
                  messages.types.ts (протокол content ↔ background), manifest.json
  userscript/     index.ts — Host для менеджеров userscript-ов
  types.d.ts      описания модулей без типов: gifenc, `*.css` и `gif-worker:code` строкой; флаг `window.__amoStickers`
dev/harness.html  стенд: разметка инпута amo на CSS его страницы (`dev/amo.css`, в git не лежит), вставка
                  и «Отправить» замоканы
scripts/          скрипты CI: version.ts — чистая логика проверки версии (типы — version.types.ts);
                  check-version.mjs — её запуск в CI
tests/            юнит-тесты, helpers/
.github/          workflows/ci.yml — проверки PR; workflows/release.yml — релиз из master; actions/setup — окружение
openspec/         specs/ — действующие требования; changes/ — proposal, design, specs, tasks задачи;
                  changes/archive/ — закрытые
local/            локальные заготовки под конкретное окружение; в .gitignore, eslint его не трогает
CLAUDE.local.md   локальные заметки; в .gitignore
```

## Как работает

### Встраивание в amo

`start(host)` в `core/app.ts` запускается один раз на страницу (флаг `window.__amoStickers`). MutationObserver на
`body` (с группировкой в `requestAnimationFrame`) ищет поля ввода и вставляет кнопку сразу после обёртки эмодзи.
Классы обёртки и иконки повторяют родную кнопку эмодзи — tailwind-стили amo применяются к ней без своего CSS, а
цвет иконки открытого/закрытого пикера переключается заменой классов: базовый `fill` заменяется, а не дополняется,
иначе из двух `fill-*` победит тот, что позже в CSS amo.

`data-testid` в amo нет: селекторы в `amoDom.ts` держатся за aria-атрибуты (`aria-placeholder`,
`aria-label="Send message"`, `aria-label="cancel edit"`) и стабильные tailwind-классы. Знание о DOM amo живёт только
в этом файле — при правке вёрстки amo меняется он один.

### Пикер

Пикер — Shadow DOM, его хост вставляется внутрь кнопки: `position: fixed` считается от предка с transform —
контейнера поля ввода, как у родного попапа эмодзи. Shadow root отрезает CSS amo от пикера и CSS пикера от amo:
preflight Tailwind не сбрасывает вёрстку страницы. Корень — `closed`: во вкладке «Настройки» лежат ключи GIF и токен
бота, и через `element.shadowRoot` скрипт страницы до них не доберётся.

`app.ts` живёт в DOM amo без Preact и управляет пикером через фасад `createPicker(host, { onSend, onClose })`:
`open()`, `close()`, `setTheme(isDark)`. Фасад перерисовывает дерево `render()` на каждое изменение, а закрытый
пикер остаётся смонтированным — вкладка и запрос поиска переживают повторное открытие. Данные и действия
(настройки, паки, статус, отправка, импорт из Telegram) компоненты берут из `usePicker()` провайдера
`PickerProvider`, текущее представление — из `usePickerView()`. Занятость отправки живёт в ячейке (`useCellSend`):
повторное нажатие на ту же ячейку не уходит вторым стикером, соседние остаются доступны.

Панель — `<dialog>` с `aria-label`, вкладки — паттерн ARIA tabs: в порядке Tab стоит только выбранная вкладка,
стрелки, `Home` и `End` переводят фокус, открывает вкладку Enter или пробел. Представление лежит в единственном
`tabpanel` с `aria-labelledby` выбранной вкладки, строка статуса — постоянная live region (`role="status"`). Кнопки
ячеек называются по `cellName/`: «Отправить стикер 😀», «Отправить GIF «cat»».

Тема следует за классом `dark` на `<html>`: `app.ts` следит за ним MutationObserver-ом и зовёт `setTheme`, корень
пикера получает класс `dark`, а `dark:`-варианты Tailwind (`darkMode: 'selector'`) срабатывают внутри shadow root.
Цвета в компонентах — только токены из `tailwind.config.ts`, без hex-литералов и inline-цветов.

### Сборка CSS и Worker-а

`picker.css` собирает esbuild-плагин `tailwind` в `build.mjs`: PostCSS с Tailwind по конфигу из `tailwind.config.ts`, в
сборке — минификация (в `watch` CSS остаётся читаемым), и в бандл CSS попадает строкой (loader `text`,
`declare module '*.css'` в `src/types.d.ts`). Фасад кладёт её `<style>` в shadow root. Tailwind ищет классы в
`src/core/ui/**/*.tsx`; конфиг и компоненты плагин отдаёт в `watchFiles`, поэтому `pnpm watch` пересобирает CSS при их
правке.

Код Worker-а кодирования GIF собирает esbuild-плагин `gif-worker`: `src/core/gifWorkerEntry.ts` — отдельным бандлом
(IIFE, в сборке минифицирован, в `watch` — с inline-sourcemap), который попадает в ядро строкой из виртуального модуля
`gif-worker:code` (`GIF_WORKER_CODE`, `declare module` в `src/types.d.ts`). Строкой — потому что userscript не может
подключить отдельный файл Worker-а, и ядро запускает его из blob URL. Код Worker-а лежит в `content.js` и в
userscript; `background.js` конвертацию не импортирует, и строки в нём нет. Входы бандла Worker-а плагин отдаёт в
`watchFiles` — правка кодировщика в `pnpm watch` пересобирает и код Worker-а внутри ядра.

Vitest плагина не знает, поэтому `gif-worker:code` в тестах не грузится: его импортирует только `workerSink.ts`, а
тесты проверяют клиент Worker-а (`workerSinkClient.ts`) и протокол (`gifWorker.ts`) без него. `convert.ts` и
`frameSink.ts` тесты не импортируют напрямую, а тест модуля, который тянет `convert.ts` транзитивно
(`telegram.test.ts` через `sources/telegram.ts`), обязан подменить его `vi.mock` — иначе импорт упрётся в
`gif-worker:code`.

### Отправка

```
blob → File(image/gif) → paste в contenteditable → вложение → click [aria-label="Send message"]
```

В `DataTransfer` кладётся **только** файл: при наличии `text/plain` поле вставит текст, а не вложение.
Вложение ждём до 15 с по появлению кнопки «Отправить». Если в поле есть текст или вложения, либо идёт
редактирование, отправка блокируется `SendError` — иначе стикер ушёл бы вместе с черновиком.

### Конвертация

amo перекодирует PNG и WebP в JPEG с белым фоном, без изменений проходит только GIF — поэтому любой источник
приводится к GIF с 1-битной прозрачностью (`convert.ts`). Конвертация потоковая: несжатый кадр в памяти один, а
кодирование идёт в Web Worker-е, не занимая главный поток страницы.

```
источник → план кадров → кадр на холст прохода (+ подпись) → getImageData → приёмник (Worker | главный поток) → GIF
```

- **Источник кадров** (`openFrameSource`, `frameSource*.ts`) — план (позиция и задержка кадра) и отрисовка кадра по
  номеру; размер вписан в 512 px, мелкий источник не увеличивается. Картинки — `ImageDecoder` (план строится
  декодированием каждого кадра с немедленным `close`) с фолбэком на `createImageBitmap`; видео — покадровым seek
  одного `<video>`; `.tgs` — Lottie на своём холсте, в холст прохода кадр переносится `drawImage`. Источник служит
  всем проходам и освобождается в `dispose` при любом исходе: у видео снимается `src`, зовётся `load()` и
  отзывается blob URL — иначе декодер и файл держатся до сборки мусора и выгрузки страницы.
- **Анимация** — до 100 кадров и 4 с, 25 fps (40 мс — ровно 4 сотых: у GIF задержка в сотых); у анимированной
  картинки — её собственные задержки, одиночный кадр даёт статичный GIF.
- **Выбор стороны** (`sidePick.ts`, `encodeLadder.ts`) — ряд: сторона источника, затем меньшие неё из 384 / 320 /
  256 px. Если план длиннее 8 кадров (`SAMPLE_FRAMES`) и сторона источника больше 256 px (ряду есть куда уменьшаться),
  сначала пробный проход: 8 кадров равномерно по плану в размере источника; иначе старт — сторона источника. Вес пробы
  масштабируется на весь план и по площади на каждую сторону ряда, с запасом `SAFETY`. Старт по пробе — наибольшая
  сторона, чья оценка не больше 2 МБ (`MAX_GIF_BYTES`, одна константа на весь код). GIF тяжелее лимита кодируется заново
  следующей стороной ряда — новым проходом по источнику; на последней стороне результат отдаётся как есть. Подпись
  рисуется на холсте прохода, в том числе в пробе, — текст не мылится от даунскейла.
- **Кодировщик** (`gifEncoder.ts`, без DOM) — кадр индексируется и сжимается сразу при записи. Палитра строится в
  rgb565 только по непрозрачным пикселям, прозрачность — отдельный индекс; упорядоченный дизеринг Байера 4×4
  включается, если средняя ошибка цвета без него выше порога: узор привязан к координатам и не мерцает в анимации.
- **Приёмник кадров** (`createFrameSink`, свой на каждый проход) — кодирует в Worker-е из blob URL (`workerSink.ts`,
  `workerSinkClient.ts`). Кадр уходит Worker-у transfer-ом, без копии; без `ack` в полёте один кадр: захват не
  обгоняет кодирование, а проба читает вес сразу после последнего кадра и должна его учесть. Worker живёт один
  проход: `close` останавливает его, и память кодировщика уходит вместе с ним.
- **Фолбэк** (`frameSinkMain.ts`) — тот же кодировщик на главном потоке, поток уступается странице после каждого кадра.
  Включается, если Worker не заработал до первого `ack` (CSP, исключение конструктора): первый кадр уходит Worker-у
  копией и повторяется в фолбэке, в консоль — `console.warn`. После такого сбоя фабрика (`createFallbackAwareSink`) до
  перезагрузки страницы сразу отдаёт фолбэк, без повторного запуска Worker-а. Сбой Worker-а после первого `ack` и его
  сообщение `error` — ошибка конвертации: кадры не кодируются второй раз на главном потоке. В скрытой вкладке фолбэк
  заметно медленнее: браузер тормозит `setTimeout(0)`, которым он уступает поток, — поэтому основной путь — Worker.
- GIF без подписи и в пределах 2 МБ проходит как есть.

### Хранение

IndexedDB `amo-stickers` на домене amo: паки (`tg:<имя>` для импорта, `custom` — свои стикеры), стикеры (готовые
GIF-блобы) и недавние (до 40, повторная отправка поднимает элемент наверх). Настройки — через `Host`.

### Внешние данные

Всё, что пришло из сети, проверяется на границе (`core/net.ts`):

- запросы — только `https` к `api.telegram.org` (точно, без поддоменов), `giphy.com` и `klipy.com` с их
  поддоменами, по разобранному `URL`; та же проверка на итоговом адресе после редиректа. Service worker отвечает
  только content script-ам своего расширения;
- `Host.fetchJson` возвращает `unknown`: форму ответа сужают гарды в `sources/*.types.ts`. Элемент выдачи с
  непригодными полями или ссылкой вне политики отбрасывается, битый ответ целиком — ошибка источника;
- `Host.fetchBlob(url, maxBytes)` читает тело потоком и обрывает его на лимите (в расширении — внутри SW):
  GIF из поиска — 8 МБ, файл стикера Telegram — 5 МБ;
- `file_path` Telegram — без `..`, иначе URL схлопнется и запрос с токеном уйдёт в другой метод Bot API;
- `.tgs` распаковывается не больше 8 МБ и проходит `isLottieJson`; GIF из поиска перед вставкой — `inspectGif`.

## Тесты

Стек — vitest, проект `unit` (`tests/**/*.test.{ts,tsx}`, окружение `node`). Тесты лежат плоско в `tests/`,
хелперы — в `tests/helpers/`. Юнит-тестами покрывается любой важный код с логикой — ядро, скрипты сборки и CI; всё,
что завязано на DOM amo и отправку, проверяется на стенде `dev/harness.html` и в живом amo:

```bash
python3 -m http.server 8777 -b 127.0.0.1
open http://127.0.0.1:8777/dev/harness.html
```

Гейт коммита гоняет только тесты по изменённым файлам (`vitest --changed`); полный прогон — `pnpm test`.

## Линтинг

```
eslint.config.mjs        # flat config: typescript-eslint + prettier + jsdoc + simple-import-sort + unicorn +
                         # react-hooks и jsx-a11y на **/*.tsx
.lintstagedrc.mjs        # eslint --fix / prettier --write по staged-файлам
.husky/pre-commit        # lint-staged + tsc + vitest --changed параллельно
```

Осознанные послабления:

- `no-undef` выключен для TS: необъявленное имя ловит `tsc`.
- `no-console` разрешает `warn` и `info` наравне с `error`: код исполняется в чужой странице amo, консоль —
  единственный канал диагностики.
- `local/**` в eslint игнорируется: каталог в `.gitignore`, в нём локальные заготовки вне tsconfig.

`.claude/hooks/lint.sh` — PostToolUse-хук: после каждой правки гоняет по файлу eslint (+`tsc --noEmit` для `.ts`/
`.tsx`). Ошибки в правленом файле блокируют правку.

## CI и релизы

GitHub Actions, Node и pnpm ставятся из `.mise.toml` (`jdx/mise-action`) — те же версии, что локально.

- **PR в `master`** (`ci.yml`): отдельные статусы `lint` (eslint + prettier), `typecheck`, `test` (полный прогон, а
  не `--changed`), `build`, `version`. Новый коммит в PR отменяет прогон старого. Сборка PR лежит артефактом `build`
  прогона: `amo-stickers-<версия>.zip` и `amo-stickers.user.js` — для ручной проверки до мержа.
- **`version`** падает, если версия в трёх местах расходится или не выше версии `package.json` в `master`
  (`scripts/check-version.mjs --base origin/master`, сравнение по числам).
- **Мерж в `master`** (`release.yml`): те же проверки, затем тег `v<версия>` и GitHub Release с zip расширения
  (`manifest.json` в корне) и userscript-ом, заметки — автогенерация по PR. Если тег уже есть, релиз пропускается с
  предупреждением, прогон зелёный: версия, не поднятая при прямом push в `master`, релиза не даёт.

## Воркфлоу задачи

Одна задача — один issue, одна ветка, один PR. Репозиторий на GitHub, поэтому CLI — `gh` (`glab` здесь не
применяется). Номер issue — сквозной идентификатор: он в имени ветки, в теле PR и в коммитах. Требования и план
крупной задачи ведутся в OpenSpec (`openspec/changes/<change>`, артефакты на русском).

Скилы и команды OpenSpec (`.claude/skills/openspec-*`, `.claude/commands/opsx/`) генерирует CLI, и их текст зависит
от его версии. Версия закреплена точной в devDependencies (`@fission-ai/openspec`), поэтому перегенерация — только
`pnpm skills:update`, а не глобальный `openspec update`: иначе скилы разъедутся с версией у соседа. Обновление
скилов — поднятие версии пакета и `pnpm skills:update` в одном PR. Набор workflow берётся из глобального профиля
OpenSpec (`openspec config profile`), в репозитории его не закрепить.

1. **Issue.** Задача заводится в репозитории до правок — чтобы у PR был предмет, с которым аудит сверяет результат.
   Тело описывает наблюдаемое поведение и критерий готовности, а не план правок.

   ```bash
   gh issue create --title '<кратко, что должно измениться>' --label enhancement --body '<описание и критерий готовности>'
   ```

   Метки из набора репозитория: `bug`, `enhancement`, `documentation`.
2. **Ветка от master.** Только от свежего `master`, не от текущей ветки: иначе в PR приедут чужие коммиты.
   Имя — `<type>/<номер issue>-<краткое-имя>`, где `type` — `feature`, `fix`, `chore`, `docs`.

   ```bash
   git switch master && git pull --ff-only
   git switch -c feature/42-preact-picker
   ```
3. **Правки и PR.** Правки идут в этой ветке; перед PR — `pnpm lint` и `pnpm test` (гейт коммита их не заменяет:
   `.husky/pre-commit` гоняет vitest только по изменённым файлам). PR привязывается к issue ключевым словом в теле,
   иначе issue придётся закрывать руками.

   **Каждый PR поднимает версию**: обычный PR — минор, глобальное изменение (несовместимая смена схемы IndexedDB,
   переделка продукта) — мажор с обнулением минора. Версия записана в трёх местах, и они должны совпадать:
   `package.json` (`pnpm version <версия> --no-git-tag-version`), `src/extension/manifest.json` и `@version` в
   заголовке userscript в `build.mjs`.

   ```bash
   git push -u origin HEAD
   gh pr create --base master --fill --body 'Closes #42

   <что сделано и почему так>'
   ```
4. **Аудит.** Пользовательский скилл `review-staged` (`~/.claude/skills/`, не в репозитории) в режиме «ветка
   против master». Без него аудит идёт вручную по тому же диффу и тем же `.claude/rules/*.md`, с тем же
   требованием к находке: файл, строка, цитата из файла.

   Находки ложатся **inline-комментами в PR** — привязанными к файлу и строке, а не одним общим комментом:
   резолвить на повторном аудите можно только тред, заведённый на строке.

   Тело ревью лежит в файле (`/tmp/review.json`), а не в флагах: у `gh api` нет формы для массива объектов.

   ```json
   {
     "commit_id": "<sha головы ветки>",
     "event": "COMMENT",
     "comments": [
       {"path": "src/core/sender.ts", "line": 42, "side": "RIGHT", "body": "<находка и что с ней делать>"}
     ]
   }
   ```

   ```bash
   gh api --method POST repos/Corvus278/amo_msg_stickers/pulls/<N>/reviews --input /tmp/review.json
   ```

   Один тред — одна находка. `event: COMMENT`, а не `REQUEST_CHANGES`: автор PR и ревьюер здесь одно лицо, и
   GitHub не даёт запросить правки у самого себя.

   `line` берётся только из строк, попавших в дифф PR, — на остальные GitHub отвечает 422. Находка в строке,
   которой дифф не касался (у `review-staged` это `pre_existing`), идёт комментом к файлу целиком
   (`"subject_type": "file"` вместо `line` и `side`) либо в общий тред PR (`gh pr comment`). Общий тред резолву
   на шаге 6 не поддаётся — его закрывает ответ автора.
5. **Правка комментов.** Каждая находка правится отдельно и пушится в ту же ветку. Спорную не правят молча —
   ответ в треде с обоснованием тоже закрывает находку.

   ```bash
   gh api --method POST repos/Corvus278/amo_msg_stickers/pulls/<N>/comments/<databaseId первого коммента треда>/replies -f body='<как поправлено или почему нет>'
   ```

   Ответ идёт на **комментарий**, а не на тред: у REST есть только `databaseId` первого коммента, а резолв (шаг 6)
   просит `id` треда из GraphQL. Оба берутся одним запросом ниже.
6. **Повторный аудит и резолв.** Тот же `review-staged` по обновлённой ветке. Резолвится только тред, правка
   которого подтверждена в коде: «ответил» и «поправил» — разные вещи. Резолв идёт через GraphQL — у REST такой
   операции нет.

   ```bash
   # нерезолвнутые треды с путями и строками
   gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{id isResolved path line comments(first:1){nodes{databaseId body}}}}}}}' \
     -F owner=Corvus278 -F repo=amo_msg_stickers -F pr=<N> --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not) | {id, path, line, commentId: .comments.nodes[0].databaseId}'

   gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -F id=<id треда>
   ```

   Находки, всплывшие на повторном аудите заново, — новые треды: шаги 5 и 6 повторяются, пока нерезолвнутых не
   останется. Мерж — после этого: squash, чтобы в `master` от задачи остался один коммит, и с удалением ветки —
   issue закроется сама по `Closes` из тела PR.

   ```bash
   gh pr merge <N> --squash --delete-branch
   ```

## Правила для агентов

`.claude/rules/*.md`, читать перед правкой соответствующих файлов:

| Файл | О чём |
|---|---|
| `react.md`, `react-architecture.md` | UI на Preact: компоненты, хуки, хендлеры, `FC<Props>` |
| `typescript.md` | типы, `as`, jsdoc на полях, где лежат тесты |
| `code-style.md` | стиль кода: экспорты, `switch`, `||`, `reduce`, jsdoc |
| `naming.md` | именование, префиксы булевых |
| `linting.md` | конфиги линтеров, поток проверки, что нельзя отключать |
| `comments.md` | комментарии: «почему», а не «что» |
| `testing.md` | vitest, что покрывается тестами, а что стендом |
