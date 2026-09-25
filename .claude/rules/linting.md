---
paths:
  - "/**"
---

# Линтеры

Правила стиля и синтаксиса живут в конфигах, а не в голове:

- `/eslint.config.mjs` — JS/TS (typescript-eslint + prettier + jsdoc + simple-import-sort + unicorn; для `.tsx` —
  react-hooks + jsx-a11y);
- `/.prettierrc` + `/.prettierignore` — форматирование;
- `/tsconfig.json` — строгий TS (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).

TypeScript в проекте двух версий: `typescript` (6.x) — только для typescript-eslint, который TS 7 пока не
поддерживает; `typescript-native` (7.x, нативный tsgo) — для проверки типов (`pnpm typecheck`). Бинарь
`node_modules/.bin/tsc` занят одной из них — вызывай через скрипт, а не напрямую.

## Поток проверки

1. **Перед правкой** сомнительного места — открой конфиг и прочитай релевантную секцию. Правил много, и они меняются.
2. **После каждой правки** срабатывает PostToolUse-хук `.claude/hooks/lint.sh`:

   - `eslint` для `.ts/.tsx/.js/.mjs/.cjs` по одному файлу;
   - `tsc --noEmit -p tsconfig.json --incremental` (TS 7) для `.ts/.tsx` — типы по всему проекту (кэш в
     `node_modules/.cache/claude-tsc.tsbuildinfo`, таймаут 90 сек). Ошибки в правленом файле блокируют; ошибки в других
     файлах показываются предупреждением, чтобы не застревать на чужих долгах;
   - `severity: error` в правленом файле → exit 2, правка блокируется, ошибки — в stderr;
   - `severity: warning` → exit 0, предупреждения всё равно в stderr;
   - сбой линтера → exit 1 + диагностика.

3. **Перед завершением задачи** — `pnpm lint` (eslint + tsc + prettier параллельно) и `pnpm test`.
   0 errors и 0 warnings в новом коде.

## Запреты

- Не отключать правила через `// eslint-disable*`, `@ts-ignore`, `@ts-expect-error` ради прохождения проверки.
- Не ослаблять и не удалять правила в `eslint.config.mjs` / `tsconfig.json`. Действующие послабления и причины
  перечислены в `CLAUDE.md` («Линтинг») — новые заводятся только с обоснованием там же.
- Не обходить типы через `any`, `as unknown as T`, `@ts-nocheck`.
- Автофиксы допустимы (`eslint --fix`, `prettier --write`), после автофикса — прочитай диф. Исключение —
  `jsdoc/require-jsdoc`: его фикс вставляет пустые заглушки `/** */`, описания пиши руками.
- Если непонятно, как починить правильно, — спроси. Не прячь проблему в TODO.
