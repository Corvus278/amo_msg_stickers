## 1. Подготовка

- [x] 1.1 Ветка `feature/17-worker-frame-window-2` от свежего `master`; версия 0.7.1 → 0.8.0 в `package.json`,
  `src/extension/manifest.json` и `@version` в `build.mjs` — проверка: `node scripts/check-version.mjs --base origin/master`
  без ошибок

## 2. Контракт и фолбэк

- [x] 2.1 `src/core/frameSink.types.ts`: `flush: () => Promise<void>` в `FrameSink` с jsdoc (разрешается, когда все
  отданные кадры закодированы; без него `byteLength` может не учитывать кадры в полёте) и уточнение jsdoc
  `byteLength` — проверка: `pnpm typecheck` указывает только на ещё не реализованные `flush`
- [x] 2.2 `src/core/frameSinkMain.ts`: `flush` фолбэка разрешается сразу — проверка: тест в
  `tests/frameSinkMain.test.ts` («после `flush` вес учитывает все записанные кадры»), `pnpm test` зелёный

## 3. Клиент Worker-а

- [x] 3.1 `src/core/workerSinkClient.ts`: `flush` по D2 — список ожиданий опустошения очереди, разрешение на `ack` с
  нулём кадров в полёте, отказ в `fail` и после сбоя; при `switchToFallback` ждущие `flush` и новые вызовы — `await
  replay`, затем `fallback.flush()`; `CLOSED_MESSAGE` при вызове после `close`. Jsdoc: `createWorkerSink` — про
  `flush`; `fail` и `releaseAfterReplay` — ожидания `flush` в перечне; `Deferred` в `src/core/workerSink.types.ts` —
  ожидание опустошения очереди рядом с окном и `done` — проверка: тесты 3.2 зелёные
- [x] 3.2 `tests/workerSink.test.ts`:
  - тестовый фолбэк `fakeFallback` получает `flush`, который фиксирует вызов;
  - тест «при окне 1 вес после `write`…» заменён тестом окна 2: `flush` не разрешён до `ack` последнего кадра
    (`isSettled` — `false`), после него `byteLength` — вес этого `ack`;
  - `flush` без кадров в полёте разрешается сразу;
  - `flush` отклоняется при сбое Worker-а после первого `ack` и при вызове после `close`;
  - `flush`, заставший сбой до первого `ack`: до сбоя `isSettled(flush)` — `false`, после — разрешён после повтора
    кадра, `fakeFallback.flush` вызван, `byteLength` — вес фолбэка.

  Проверка: `pnpm test` зелёный; тест окна 2 и тест перехода на фолбэк падают, если `flush` разрешать сразу (временная
  мутация, не коммитится)

## 4. Пробный проход и окно

- [x] 4.1 `src/core/convert.ts`: `samplePass` читает `byteLength` после `await sink.flush()`, jsdoc пробы — почему нужен
  `flush`; jsdoc `writeFrames` («в памяти не копится больше одного несжатого кадра») — о кадрах в очереди приёмника
  до его окна — проверка: `pnpm typecheck` и `pnpm build` без ошибок, `rg -n 'sink\.flush\(\)' src/core/convert.ts`
  находит вызов в `samplePass`; что проба учитывает все кадры, подтверждает 5.1 (юнит-тестов у `convert.ts` нет)
- [x] 4.2 `src/core/workerSink.ts`: `MAX_IN_FLIGHT = 2`, jsdoc константы — почему 2 (две ступени конвейера, D3) и что
  проба читает вес после `flush`. Идёт после 4.1: иначе промежуточный коммит занижал бы оценку пробы — проверка:
  `pnpm lint` без ошибок и предупреждений

## 5. Приёмка на стенде

- [x] 5.1 Выбор стороны: бандлы с логом лестницы (`local/bench/build-g5.mjs` + `ladderLog.ts`) из `master` (окно 1) и
  из ветки (окно 2), все 45 стикеров `local/samples/video_gachi` в headless Chrome из `CLAUDE.local.md` — сторона,
  число проходов и SHA-256 готового GIF совпадают у каждого стикера, один полный проход у большинства; сырые данные — в
  `local/bench/`, итог — запись в `CLAUDE.local.md`
- [x] 5.2 Время: стикеры 00/12/20/30/44, 3 раунда, окно 1 (`master`) против окна 2, свободная машина (разброс раундов
  < 3 %) — окно 2 быстрее по каждому стикеру и по сумме, самая длинная задача главного потока ≤ ~1 с; цифры — в
  `CLAUDE.local.md` и в описание PR
- [x] 5.3 Сверка в живом amo (пользователь): импорт пака или свой видеостикер в расширении и userscript — GIF
  отправляется, в консоли нет `GIF worker unavailable`

## 6. Документация и гейт

- [x] 6.1 `CLAUDE.md`, «Конвертация»: вводный абзац («несжатый кадр в памяти один») — до двух несжатых кадров в очереди
  Worker-а плюс кадр на холсте; «Приёмник кадров» — окно 2 кадра, проба читает вес после `flush` — проверка:
  `rg -n 'в полёте один кадр|несжатый кадр в памяти один|больше одного несжатого' CLAUDE.md src` ничего не находит
- [x] 6.2 Гейт: `pnpm lint`, `pnpm test`, `pnpm build`, `openspec validate worker-frame-window-2 --strict` — без
  ошибок и предупреждений
