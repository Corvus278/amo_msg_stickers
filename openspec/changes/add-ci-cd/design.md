## Context

Репозиторий публичный, на GitHub (`Corvus278/amo_msg_stickers`), CI нет (`.github/` отсутствует), тегов и релизов нет,
защиты `master` нет. Проверки — только `.husky/pre-commit`. Версии Node и pnpm заданы в `.mise.toml` (`node 26.10.0`,
`pnpm 12.6.0`), `packageManager` в `package.json` — `pnpm@12.6.0`. Скрипты: `lint:es`, `lint:format`, `typecheck`,
`test`, `build`. Версия `0.3.0` записана в трёх местах, одинаково.
Мотивация — proposal.md, требования — `specs/ci-cd/spec.md`.

## Goals / Non-Goals

**Goals:**

- Версии инструментов в CI берутся из тех же файлов, что и локально, — без третьего места.
- Проверки PR и master описаны один раз.
- Релиз не требует секретов, кроме штатного `GITHUB_TOKEN`.

**Non-Goals:**

- Матрица по версиям Node/ОС: код исполняется в браузере, сборка детерминирована.
- Кэш eslint (`.eslintcache`) между прогонами: выигрыш мал, риск ложного зелёного выше.
- Перенос `pnpm lint` в CI как есть: он склеивает линт и типы в одну проверку, а в PR они нужны раздельно.

## Decisions

### Два workflow: `ci.yml` (переиспользуемый) и `release.yml`

`ci.yml` срабатывает на `pull_request` в `master` и на `workflow_call`. `release.yml` срабатывает на `push` в `master`,
первым job-ом вызывает `ci.yml` (`uses: ./.github/workflows/ci.yml`), job релиза — `needs` на него. Так проверки PR
и master описаны один раз, а релиз физически не стартует без зелёных проверок.

Альтернатива — один workflow с `if: github.event_name == 'push'` на job релиза: меньше файлов, но условия
расползаются по каждому job-у, а права `contents: write` пришлось бы давать всему workflow, включая прогоны PR.

### Job-ы проверок: `lint`, `typecheck`, `test`, `build`, `version`

Раздельные job-ы дают раздельные статусы в PR (требование «Проверки PR») и идут параллельно. Цена — установка
зависимостей в каждом, её сокращает кэш (ниже).

- `lint`: `pnpm lint:es` и `pnpm lint:format` — два шага одного job-а; `if: !cancelled()` на втором, чтобы упавший
  eslint не прятал ошибки prettier.
- `typecheck`: `pnpm typecheck`.
- `test`: `pnpm test`.
- `build`: `pnpm build`, упаковка zip (см. ниже), `actions/upload-artifact` с zip и `amo-stickers.user.js`. Этот же
  артефакт забирает job релиза — сборка не повторяется, в релиз уходит ровно проверенное.
- `version`: `node scripts/check-version.mjs` (ниже); на `pull_request` — с `--base origin/master` (рост версии), на
  `workflow_call` — без него (только согласованность). Зависимости не нужны — job без `pnpm i`.

`concurrency` на `ci.yml`: в PR группа — `github.ref` с отменой, новый коммит снимает прогон старого. Вне PR группа —
`github.sha` без отмены: в группе GitHub держит один выполняющийся и один ожидающий прогон, а новый ожидающий
заменяет прежний независимо от `cancel-in-progress`. С общей группой на `refs/heads/master` серия мержей сняла бы
проверки — а с ними и релиз — промежуточного коммита.

### Окружение: composite action `.github/actions/setup` на `jdx/mise-action`

`mise-action` ставит Node и pnpm из `.mise.toml` — ровно те версии, что локально, без дублирования в YAML. Затем кэш
pnpm store (`actions/cache`, ключ — ОС + хэш `pnpm-lock.yaml`) и `pnpm i --frozen-lockfile`. `HUSKY=0` в окружении:
хуки в CI не нужны.

Альтернатива — `pnpm/action-setup` + `actions/setup-node` с `node-version-file`: `setup-node` не читает `.mise.toml`,
версию Node пришлось бы продублировать в `.nvmrc` или YAML и держать в синхроне.

### Проверка версии — чистый модуль `scripts/version.ts` + обёртка `scripts/check-version.mjs`

Логика и ввод-вывод разнесены, чтобы логику покрыть юнит-тестами (`testing.md`):

- `scripts/version.ts` — чистые функции без импортов: разбор `MAJOR.MINOR.PATCH` (невалидная строка — ошибка),
  числовое сравнение, извлечение `@version` из текста `build.mjs`, проверка согласованности трёх источников с
  перечнем расхождений, проверка роста относительно базы. Лежит в `include` `tsconfig` — типы проверяет
  `pnpm typecheck`.
- `scripts/check-version.mjs` — тонкая обёртка: читает `package.json`, `src/extension/manifest.json`, `build.mjs`; с
  `--base <ref>` — `package.json` базы через `git show <ref>:package.json`; вызывает функции модуля, печатает
  `::error::` и выходит с кодом 1. Импортирует `./version.ts` напрямую: Node 26 снимает типы сам, сборка не нужна —
  поэтому в модуле только стираемый синтаксис TS (без `enum`, `namespace`, parameter properties).
- `tests/version.test.ts` — юнит-тесты модуля: совпадение и расхождение трёх версий, `0.10.0` > `0.9.0`, равная и
  меньшая версия, мажор с обнулением минора, невалидная версия, отсутствующий `@version` в баннере.

Для `git show` job `version` делает `actions/checkout` с `fetch-depth: 0` (база нужна в истории).

Альтернатива — весь скрипт на TS с `node:fs`/`node:child_process`: понадобились бы `@types/node` и отдельный
`tsconfig` для `scripts/` (глобальные типы Node в общем конфиге подменили бы браузерные — `setTimeout` вернул бы
`NodeJS.Timeout` в `src/`). Обёртка из десятка строк ввода-вывода этого не стоит.

Альтернатива — читать версию в `build.mjs` из `package.json` и убрать одно место: это правка сборки сверх задачи;
проверка нужна всё равно — `manifest.json` копируется как есть.

### Архив расширения

`cd dist/extension && zip -r ../amo-stickers-<версия>.zip .` — `manifest.json` в корне архива: так его понимают
«Загрузить распакованное» после распаковки и Chrome Web Store, если до него дойдёт. Упаковка — шаг job-а `build`, и
в PR, и в master: артефакт PR совпадает по форме с файлом релиза.

### Релиз

Job `release` в `release.yml`: `permissions: contents: write` (только у него; на уровне workflow — `contents: read`),
`needs: ci`. Шаги:

1. `actions/checkout`, версия — `node -p "require('./package.json').version"`.
2. Тег уже есть (`git ls-remote --exit-code --tags origin refs/tags/v<версия>`) → `::warning::` «версия <версия> уже
   выпущена», выход 0. Проверяется тег, а не релиз: тег без релиза тоже значит «версия занята».
3. `actions/download-artifact` сборки из job-а `build`.
4. `gh release create v<версия> --target $GITHUB_SHA --title v<версия> --generate-notes <zip> <user.js>` — тег
   создаётся вместе с релизом, заметки — по PR с прошлого тега.

Группы `concurrency` у `release.yml` нет по той же причине: очередь из одного ожидающего прогона теряла бы
промежуточные версии. Параллельные прогоны выпускают разные теги и не конфликтуют; повтор той же версии ловит проверка
тега. Цена — при почти одновременных мержах релизы могут появиться не в порядке версий.

## Risks / Trade-offs

- [pnpm 12 / Node 26 в `mise-action` недоступны или ставятся медленно] → кэш mise-action включён; если версия не
  ставится, это видно в первом же прогоне PR этой задачи.
- [Прямой push в `master` без подъёма версии] → релиз пропускается с предупреждением, изменения ждут следующего
  подъёма; правило ловит проверка версии в PR, а прямые push-и закрывает защита ветки.
- [Без защиты `master` красный PR можно смержить] → включение required checks — ручной шаг в tasks.
- [Тег создан, загрузка файлов упала] → повторный запуск увидит тег и пропустит релиз; чинится руками:
  `gh release upload v<версия> …` или удаление тега и перезапуск. Редкий случай, автоматизация не окупается.
- [`generate-notes` на первом релизе берёт всю историю] → приемлемо, первый релиз один.

## Migration Plan

1. PR этой задачи поднимает версию до `0.4.0`; его прогон — первая проверка `ci.yml` на живом GitHub.
2. После мержа `release.yml` выпускает `v0.4.0` — проверка релиза.
3. Руками: в настройках репозитория правило защиты `master` с обязательными проверками `lint`, `typecheck`,
   `test`, `build`, `version`.

Откат: удалить `.github/workflows/*` отдельным PR; выпущенные релизы и теги остаются.
