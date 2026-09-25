# План прогона: stream-sticker-conversion

База прогона: `5efdc818a25dbafb346a1a0a7fa68ee8809f5d06`
Гейт: `pnpm lint && pnpm test && pnpm build`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest run --project=unit tests/<файл>.test.ts`
Долгие слои: стенд `dev/harness.html` через chrome MCP (сборка `pnpm build`/`pnpm watch`, пак `video_gachi`) — G1, G4, G5, G6, G7
Хук коммита: lint-staged + полный `pnpm typecheck` + `vitest --changed` — каждая группа оставляет типы и тесты зелёными.

## Контракты

- **K1 Кодировщик** — `createGifEncoder({ width, height, isAnimated })` в `src/core/gifEncoder.ts` → `write(rgba, delayMs)`,
  `byteLength`, `finish(): Uint8Array`; без DOM. Владелец G2; потребители G4, G6.
- **K2 Выбор стороны** — `pickSide(sampleBytes, sampleCount, frameCount, side)`, `sampleIndices(frameCount)`,
  `sideLadder(side)` в `src/core/sidePick.ts`; `SAMPLE_FRAMES = 8`, `SAFETY`, `MAX_GIF_BYTES = 2 * 1024 * 1024` —
  одна константа на весь код (лестница в `convert.ts` берёт её же). Владелец G2; потребители G4, G5.
- **K3 Источник кадров** — `openFrameSource(blob, kind, maxSide)` в `src/core/frameSource.ts` → `{ width, height,
  plan: { position, delayMs }[], draw(i, ctx, w, h), dispose() }`; размер вписан в `maxSide`. Владелец G3; потребитель G4.
- **K4 Приёмник кадров** — `createFrameSink({ width, height, isAnimated })` в `src/core/frameSink.ts` →
  `write(rgba, delayMs): Promise<void>`, `byteLength`, `finish(): Promise<Uint8Array>`, `close()`; после `write` буфер
  `rgba` вызывающим не используется (transfer). G4 вводит с фолбэком, G6 добавляет Worker за той же фабрикой, не правя
  `convert.ts`. Владелец G4; потребитель G6.
- **K5 Код Worker-а** — виртуальный модуль `gif-worker:code` с экспортом `GIF_WORKER_CODE` (описан в `src/types.d.ts`)
  импортирует только `src/core/workerSink.ts`; юнит-тесты не грузят его ни прямо, ни через `convert.ts` без `vi.mock`.
  Владелец G6; потребитель G7 (8.2).

## Группы

### G1 · Подготовка и базовая линия · S · волна 1

- Задачи: 1.2, 1.3
- Также: стенд-часть 2.1 (задача остаётся `[ ]`, живой amo — пользователь); итог — в `design.md`, Risks
- Зависит от: —
- Файлы: `package.json`, `src/extension/manifest.json`, `build.mjs` (строка `@version`), `design.md`, `CLAUDE.local.md`
- Требования: `sticker-conversion` → «Ресурсы конвертации» (база для сравнения)
- Design: D3, D5
- Контракты: —
- Усиление проверок: 1.3 и спайк 2.1 — сборка из базы прогона в отдельном `git worktree`, не из рабочего дерева
  (G2 и G3 правят код в той же волне); цифры базовой линии и её GIF — в `CLAUDE.local.md` для G5 и G7

### G2 · Потоковый кодировщик и выбор стороны · M · волна 1

- Задачи: 3.1, 3.2, 3.3, 3.4
- Зависит от: —
- Файлы: `src/core/gifEncoder*.ts`, `src/core/sidePick*.ts`, `src/core/convert.ts` (только перенос `indexFrame`),
  `tests/gifEncoder.test.ts`, `tests/sidePick.test.ts`, `tests/helpers/**`
- Требования: `sticker-conversion` → «Размер и вес»
- Design: D2, D6
- Контракты: вводит K1, K2
- Усиление проверок: 3.2 — эталон байт-в-байт: хэш `encodeGif` базы на синтетических кадрах снят кодом базы до
  переноса; `inspectGif` не видит задержек, disposal и прозрачности — парсер GCE в `tests/helpers/`, прозрачный
  пиксель — по индексу кадра; 3.4 — сценарии спеки «Тяжёлая анимация» и «Лимит недостижим» числами

### G3 · Источники кадров · M · волна 1

- Задачи: 5.1, 5.2, 5.3, 5.4
- Зависит от: —
- Файлы: `src/core/frameSource*.ts` (новые; `convert.ts` не трогает — старые копии хелперов удаляет G4)
- Требования: `sticker-conversion` → «Ресурсы конвертации» (освобождение `<video>`), «Размер и вес» (4 с, 100 кадров)
- Design: D1, D7
- Контракты: вводит K3
- Усиление проверок: источники подключаются только в G4 — стенд-проверки 5.1–5.4 выполняет G4; здесь — типы, eslint
  и сверка плана кадров с `convert.ts` базы (25 fps, 4 с, 100 кадров, шаг `.tgs`, нижняя граница 20 мс)

### G4 · Оркестрация и фолбэк: первый сквозной срез · M · волна 2

- Задачи: 4.4, 6.1, 6.2
- Зависит от: G2, G3
- Файлы: `src/core/convert.ts`, `src/core/convert.types.ts`, `src/core/frameSink*.ts`, `src/core/encodeLadder*.ts`,
  `tests/encodeLadder.test.ts`
- Требования: `sticker-conversion` → «Размер и вес», «Ресурсы конвертации»
- Design: D1, D5, D6, D8
- Контракты: вводит K4; потребляет K1, K2, K3
- Усиление проверок: лестница — чистая функция с внедрённым проходом, тесты в `node` на сценарии «Оценка ошиблась»,
  «Лимит недостижим», «≤ 8 кадров — без пробы», новый проход зовёт источник, а не прошлые кадры; 6.1 —
  `git diff <база> -- src/core/sources/telegram.ts src/core/ui/Picker/useStickerDraft` пуст; стенд-проверки 5.1–5.4
  (битый `.webm` < 10 с, heap snapshot без `HTMLVideoElement`, `.tgs` 60 fps/3 с → 75×40 мс, WebP и PNG)

### G5 · Сверка на живых образцах video_gachi · S · волна 3

- Задачи: 7.2
- Зависит от: G1, G4
- Файлы: `src/core/sidePick.ts` (только `SAFETY`), `design.md` (Open Questions), `CLAUDE.local.md`
- Требования: `sticker-conversion` → «Размер и вес», «Ресурсы конвертации»
- Design: D6, Risks
- Контракты: потребляет K2
- Усиление проверок: число проходов — из временного лога, не коммитится; стикер со всей лестницей — пик памяти
  не выше стикера с одним проходом (сценарий «Повторная попытка»); long task фолбэка ≤ ~1 с против базы 1.3

### G6 · Worker из blob URL · M · волна 4

- Задачи: 4.1, 4.2, 4.3
- Зависит от: G1 (итог 2.1), G2, G4
- Файлы: `build.mjs`, `src/types.d.ts`, `src/core/gifWorker*.ts`, `src/core/workerSink*.ts`, `src/core/frameSink.ts`,
  `tests/workerSink.test.ts`
- Требования: `sticker-conversion` → «Ресурсы конвертации» («Окружение без Worker»)
- Design: D3, D4, D5
- Контракты: вводит K5; потребляет K1, K4
- Усиление проверок: 4.3 — клиент с внедрённым конструктором Worker-а, тест в `node` с фейком: в полёте ≤ 2 кадров,
  ошибка до первого `ack` → фолбэк и флаг страницы, после — отказ конвертации, `terminate` в `finally`

### G7 · Приёмка на стенде и документация · S · волна 5

- Задачи: 7.1, 8.1, 8.2
- Зависит от: G5, G6
- Файлы: `CLAUDE.md`
- Требования: `sticker-conversion` → «Размер и вес», «Ресурсы конвертации»
- Design: D1–D8
- Контракты: проверяет K5 (`pnpm test` без плагина `build.mjs`)
- Усиление проверок: 7.1 — сверка с GIF базовой линии 1.3 на пути Worker-а; импорт `video_gachi` целиком на стенде

## Вне групп

- 2.1 (живой amo), 7.3, 7.4 — пользователь в живом amo; 8.3 — PR и CI после его сверки.

## Волны

1. G1, G2, G3 — файлы не пересекаются; G1 собирает базу в отдельном worktree
2. G4
3. G5 — сверка на живых образцах сразу за первым сквозным срезом (фолбэк на главном потоке)
4. G6
5. G7
