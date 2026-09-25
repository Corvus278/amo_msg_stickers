## 1. Подготовка

- [x] 1.1 Завести issue «CI: проверки PR и релиз из master» (`gh issue create --label enhancement`), ветку
  `chore/<N>-ci-cd` от свежего `master`; проверка: `git log master..HEAD` пуст до первых правок
- [x] 1.2 Поднять версию до `0.4.0` в `package.json` (`pnpm version 0.4.0 --no-git-tag-version`),
  `src/extension/manifest.json` и `@version` в `build.mjs`; проверка: `rg '0\.4\.0' package.json build.mjs src/extension/manifest.json` — три совпадения

## 2. Проверка версии

- [x] 2.1 Написать `scripts/version.ts` — чистые функции: разбор `MAJOR.MINOR.PATCH`, числовое сравнение, `@version`
  из текста баннера, согласованность трёх источников, рост относительно базы; только стираемый синтаксис TS;
  добавить `scripts` в `include` `tsconfig.json`; проверка: `pnpm typecheck` и `pnpm lint:es` чистые
- [x] 2.2 Написать `tests/version.test.ts`: совпадение и расхождение трёх версий (в ошибке все три значения),
  `0.10.0` > `0.9.0`, равная и меньшая версия базы, мажор с обнулением минора (`1.0.0` > `0.9.0`), невалидная версия,
  баннер без `@version`; проверка: `pnpm test` зелёный, тесты падают при поломке сравнения (временно заменить на
  строковое — откатить)
- [x] 2.3 Написать обёртку `scripts/check-version.mjs`: чтение трёх файлов, `--base <ref>` через `git show`, импорт
  `./version.ts`, `::error::` и код 1; проверка: без флага на ветке — код 0; `node scripts/check-version.mjs --base
  master` при `0.4.0` против `0.3.0` — код 0; временно вернуть `manifest.json` на `0.3.0` — код 1 с тремя значениями;
  временные правки откатить (`git diff` чистый вне задачи)

## 3. Workflow проверок

- [x] 3.1 Создать `.github/actions/setup/action.yml`: `jdx/mise-action`, кэш pnpm store по хэшу `pnpm-lock.yaml`,
  `pnpm i --frozen-lockfile` с `HUSKY=0`; проверка — в 3.3
- [x] 3.2 Создать `.github/workflows/ci.yml`: триггеры `pull_request` в `master` и `workflow_call`, `permissions:
  contents: read`, `concurrency` по ref с отменой на `pull_request`, по sha вне PR, job-ы `lint` (eslint, prettier с `if: !cancelled()`), `typecheck`,
  `test`, `build` (сборка, zip `amo-stickers-<версия>.zip` из `dist/extension` с `manifest.json` в корне, артефакт с
  zip и `amo-stickers.user.js`), `version` (`fetch-depth: 0`, `--base origin/master` только на `pull_request`);
  проверка: `pnpm lint:format` чистый, YAML разбирается (`node -e` с чтением через `yaml`, либо `actionlint`, если
  установлен)

## 4. Workflow релиза

- [x] 4.1 Создать `.github/workflows/release.yml`: `push` в `master`, job `ci` через `uses: ./.github/workflows/ci.yml`,
  job `release` с `needs: ci`, `permissions: contents: write`, без группы `concurrency`; шаги: версия из
  `package.json`, пропуск с `::warning::` при существующем теге `v<версия>`, `download-artifact`,
  `gh release create v<версия> --target $GITHUB_SHA --generate-notes` с zip и userscript-ом; проверка: YAML
  разбирается, `pnpm lint:format` чистый

## 5. Документация

- [x] 5.1 `CLAUDE.md`: раздел «CI и релизы» — какие проверки идут в PR, что релиз выходит сам после мержа при новой
  версии, что проверка версии падает без подъёма; в «Структуре» — `.github/` и `scripts/`; проверка: чтение диффа
- [x] 5.2 `README.md`: установка расширения и userscript-а из последнего релиза (`releases/latest`), сборка из
  исходников — как запасной путь; проверка: чтение диффа

## 6. Проверка на GitHub

- [x] 6.1 `pnpm lint` и `pnpm test` локально зелёные; push ветки, PR с `Closes #<N>`; проверка: в PR пять зелёных
  статусов (`lint`, `typecheck`, `test`, `build`, `version`), в прогоне артефакт с `amo-stickers-0.4.0.zip` и
  `amo-stickers.user.js`
- [x] 6.2 Негативная проверка в PR: временный коммит с нарушением prettier — падает только `lint`; откатить коммит
  (revert), статусы снова зелёные
- [x] 6.3 Скачать артефакт PR, распаковать zip, «Загрузить распакованное» в Chrome; проверка: расширение без ошибок
  манифеста, версия `0.4.0`
- [x] 6.4 После мержа (squash) — проверка: прогон `release.yml` зелёный, есть тег `v0.4.0` на коммите мержа и релиз
  `v0.4.0` с `amo-stickers-0.4.0.zip` и `amo-stickers.user.js` (`gh release view v0.4.0`)
- [x] 6.5 Перезапустить прогон релиза (`gh run rerun`); проверка: прогон зелёный, предупреждение «уже выпущена»,
  файлы релиза не изменились
- [x] 6.6 Передать пользователю ручной шаг: защита `master` с обязательными проверками `lint`, `typecheck`, `test`,
  `build`, `version` (Settings → Branches); проверка: пользователь подтвердил или отказался
