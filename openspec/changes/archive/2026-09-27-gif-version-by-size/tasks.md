## 1. Выбор версии по весу

- [x] 1.1 Перенести `MAX_REMOTE_GIF_BYTES` (8 МБ) из `src/core/app.ts` в `src/core/net.ts` и импортировать его в `app.ts`
  (design, решение 5); проверка — `pnpm typecheck` без ошибок, поведение скачивания прежнее
- [x] 1.2 Добавить вес версии в `src/core/sources/gifs.types.ts`: необязательное `size` у `GiphyImage` (строка) и
  `TenorMedia` (число) с jsdoc; гарды формы не ужесточаются — элемент без `size` или с непригодным `size` проходит, как
  сейчас (design, решение 3); проверка — существующие тесты `tests/gifs.test.ts` зелёные
- [x] 1.3 Реализовать в `src/core/sources/gifs.ts` выбор версии для отправки по весу: кандидаты с весом, прошедшие гард
  и `isAllowedUrl`; самая тяжёлая не больше `MAX_GIF_BYTES`, иначе самая лёгкая не больше `MAX_REMOTE_GIF_BYTES`, иначе
  самая лёгкая из всех с весом; равный вес — первая по списку; нет кандидатов с весом — прежний `pickVariant` с
  прежними списками (design, решения 1–3); проверка — тесты 2.1
- [x] 1.4 Списки кандидатов: GIPHY — `original`, `downsized_large`, `downsized_medium`, `downsized`, `fixed_height`,
  `fixed_width`, `fixed_height_small`, `fixed_width_small`; KLIPY — `gif`, `mediumgif`, `tinygif`, `nanogif` и
  `media_filter` = `gif,mediumgif,tinygif,nanogif`; превью не меняется (design, решение 2); проверка — тест 2.1 на
  URL запроса KLIPY с новым `media_filter`

## 2. Тесты выбора версии

- [x] 2.1 Дописать `tests/gifs.test.ts` для GIPHY и KLIPY: версия до 2 МБ побеждает тяжёлую (`downsized` 1,9 МБ при
  `original` 7 МБ; `tinygif` 1,4 МБ при `gif` 13 МБ и `mediumgif` 5 МБ); из нескольких до 2 МБ — самая тяжёлая; нет
  версии до 2 МБ — самая лёгкая до 8 МБ; все тяжелее 8 МБ — самая лёгкая; равный вес — первая по списку; версия с
  весом вне сетевой политики пропускается; выдача без весов и с непригодным `size` (`"abc"`, `0`, `-1`) — прежний выбор
  по имени; `media_filter` в запросе KLIPY; проверка — `pnpm test` зелёный

## 3. Пережатие на отправке

- [x] 3.1 В ветке `remote` `toFile` в `src/core/app.ts`: после `toCheckedGifFile` файл тяжелее `MAX_GIF_BYTES`
  пережимать `toStickerGif(file, 'image')` и отдавать `toGifFile(blob, sendFileName(item))`; файл до 2 МБ — как есть
  (design, решение 4); проверка — `pnpm typecheck`, стенд 4.2

## 4. Документация, версия и проверка

- [x] 4.1 Обновить `CLAUDE.md`: в «Отправка» — пережатие GIF из поиска тяжелее 2 МБ, в «Внешние данные» — выбор версии
  по весу из выдачи и лимит 8 МБ как защита, в описании `net.ts` / `sources/` — где живёт лимит; проверка — ревью диффа
- [x] 4.2 Проверить на стенде `dev/harness.html` с ключами из `.env`: KLIPY «ган вест» — GIF, у которой `gif` больше
  8 МБ, отправляется без «Файл больше 8 МБ», `alt` в ленте с маркером `amostk.k-gif`, файл не тяжелее 2 МБ; GIPHY —
  уходит `downsized`; проверка — отчёт с весом отправленных файлов
- [x] 4.3 Поднять версию до 0.11.1 в `package.json` (`pnpm version 0.11.1 --no-git-tag-version`),
  `src/extension/manifest.json` и `@version` в `build.mjs`; проверка — `node scripts/check-version.mjs --base origin/master`
- [x] 4.4 Прогнать `pnpm lint` и `pnpm test`; проверка — 0 ошибок и 0 предупреждений, все тесты зелёные
