## 1. Ключ в manifest

- [x] 1.1 Добавить в `src/extension/manifest.json` поле `key` — публичный ключ из панели CWS одной строкой base64, без
  заголовков PEM. Проверка: `pnpm build`, в `dist/extension/manifest.json` есть то же поле `key`.
- [x] 1.2 Тест в `tests/` (по соседству с `extensionIcons.test.ts`): ключ из manifest разбирается как публичный ключ
  (`node:crypto`), ID, вычисленный по алгоритму Chrome, равен `abjnjphijggkkdbbmkldhibgepgdcgip`. Проверка: `pnpm test`
  зелёный; замена одного символа ключа роняет тест.

## 2. Версия и проверка

- [x] 2.1 Поднять версию до 0.14.2 в `package.json`, `src/extension/manifest.json` и `@version` в `build.mjs`.
  Проверка: `node scripts/check-version.mjs` без ошибок.
- [x] 2.2 `pnpm lint` и `pnpm test` без ошибок и предупреждений.
- [x] 2.3 Вручную в Chrome: загрузить `dist/extension` как распакованное — ID `abjnjphijggkkdbbmkldhibgepgdcgip`;
  сохранить ключ GIPHY, собрать в другую папку и загрузить её, не удаляя расширение, — ключ на месте. Результат —
  в теле PR.
