## 1. Подготовка

- [x] 1.1 Ветка `fix/15-userscript-gm-network` от свежего `master` под issue #15; проверка: `git log master..HEAD`
  пуст до первых правок
- [x] 1.2 Поднять версию до `0.7.0` в `package.json` (`pnpm version 0.7.0 --no-git-tag-version`),
  `src/extension/manifest.json` и `@version` в `build.mjs`; проверка: `node scripts/check-version.mjs --base master`
  — код 0

## 2. Контракты ядра и общие хелперы

- [x] 2.1 В `core/host.types.ts` разделить `Host` на `HostNetwork` (`fetchJson`, `fetchBlob`) и `HostSettings`
  (`getSettings`, `setSettings`), `Host = { name } & HostNetwork & HostSettings`; jsdoc полей — в контрактах, jsdoc
  `Host` описывает окружения без деталей режимов userscript; проверка: `pnpm typecheck` чистый, `src/core/**` и
  `src/extension/**` без правок, `pnpm test` зелёный
- [x] 2.2 В `core/net.ts` экспортировать `assertAllowedUrl`, `NOT_ALLOWED`, `tooBigError` и вынести ошибку
  `HTTP <код> <начало тела>` в экспортируемый `httpError(status, body)`, которым пользуется `fetchChecked`; поведение
  не меняется; проверка: `tests/net.test.ts` и `tests/background.test.ts` зелёные без правок ожиданий
- [x] 2.3 Тест `httpError` в `tests/net.test.ts`: тело обрезается до 200 символов, в тексте есть `HTTP <код>`;
  проверка: `pnpm test` зелёный
- [x] 2.4 В `eslint.config.mjs` — `no-restricted-imports` для `src/core/**`: запрет импорта из `src/userscript/` и
  `src/extension/` с сообщением о границе ядра; строка про правило в `CLAUDE.md`, раздел «Линтинг»; проверка:
  `pnpm lint` зелёный, временный импорт из `src/userscript/` в файле `src/core/` даёт ошибку eslint (временная
  правка не коммитится)

## 3. Адаптер сети через GM API

- [x] 3.1 Типы используемой части GM API в `src/userscript/gm.types.ts`: детали запроса с `responseType`,
  `anonymous`, колбэками `onload` / `onerror` / `ontimeout` / `onabort` / `onprogress` / `onreadystatechange`;
  ответ с `status`, `finalUrl`, `responseHeaders`, `response`, `responseText`, `loaded`; handle с `abort`;
  `GM_getValue` / `GM_setValue`. Глобальных объявлений `GM_*` нет ни здесь, ни в `src/types.d.ts`; проверка:
  `pnpm typecheck` чистый
- [x] 3.2 `src/userscript/gmNetwork.ts`: `gmNetwork(request): HostNetwork` по design.md — проверка адреса до
  запроса, `anonymous: true`, `finalUrl` через `isAllowedUrl`, не-2xx → `httpError`, лимит по `Content-Length` на
  `HEADERS_RECEIVED`, по `loaded` в `onprogress` и по `byteLength` на `onload` с `abort()`, `content-type` из
  `responseHeaders` в тип Blob, ошибки сети без адреса в тексте; проверка: eslint и `pnpm typecheck` по файлу
  чистые
- [x] 3.3 `tests/gmNetwork.test.ts` с мок-функцией запроса: адрес вне политики — ошибка без вызова запроса;
  `finalUrl` вне политики — ошибка `Адрес вне списка разрешённых`; 404 — ошибка с `HTTP 404` и началом тела (для
  JSON и Blob); `Content-Length` больше лимита — `abort()` и ошибка `Файл больше`; `loaded` больше лимита в
  `onprogress` — `abort()` и та же ошибка; ответ больше лимита без `progress` — ошибка на `onload`; успешный JSON
  разобран; Blob с типом из `content-type`; `onerror` / `ontimeout` — ошибка без токена в тексте; в деталях запроса
  `anonymous: true`; проверка: `pnpm test` зелёный
- [x] 3.4 `src/userscript/fetchNetwork.ts`: `fetchNetwork(): HostNetwork` — нынешняя сеть userscript на
  `fetchChecked` и `readResponseLimited`, перенесённая без изменения поведения; проверка: eslint и `pnpm typecheck`
  по файлу чистые

## 4. Адаптеры настроек

- [x] 4.1 `src/userscript/settings.ts`: `gmSettings(gmStore, storage): HostSettings` — хранилище менеджера, перенос
  из `storage` при пустом хранилище менеджера с удалением ключа, удаление битого JSON без переноса, запись только в
  менеджер; `localStorageSettings(storage): HostSettings` — нынешнее поведение; `storage` — срез `Storage`
  (`getItem`, `setItem`, `removeItem`); проверка: eslint и `pnpm typecheck` чистые
- [x] 4.2 `tests/userscriptSettings.test.ts` с фейковыми хранилищами: перенос из `storage` (значения на месте, ключ
  удалён), значение менеджера важнее `storage`, запись идёт только в менеджер, битый JSON удалён и даёт
  `DEFAULT_SETTINGS`, `localStorageSettings` читает и пишет `storage` и дополняет пропуски `DEFAULT_SETTINGS`;
  проверка: `pnpm test` зелёный

## 5. Точка входа userscript и сборка

- [x] 5.1 `src/userscript/index.ts` — единственное место выбора режима: `declare const` для `GM_xmlhttpRequest`,
  `GM_getValue`, `GM_setValue` в модуле; `typeof GM_xmlhttpRequest === 'function'` — `gmNetwork`, иначе
  `fetchNetwork`; `typeof GM_getValue === 'function'` — `gmSettings`, иначе `localStorageSettings`; `Host` с
  `name: 'userscript'` собирается из адаптеров и уходит в `start`; jsdoc модуля описывает оба режима; проверка:
  `pnpm typecheck` чистый, `rg -n "GM_" src/core` пусто
- [x] 5.2 Заголовок в `build.mjs`: `@grant none` заменить на `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`,
  добавить `@connect api.telegram.org`, `@connect giphy.com`, `@connect klipy.com`, `@sandbox DOM`,
  `@inject-into content`; проверка: `pnpm build`, в заголовке `dist/amo-stickers.user.js` эти строки есть,
  `@grant none` нет, `localhost` нет

## 6. Документация

- [x] 6.1 `CLAUDE.md`: разделы «Стек и сборка» (сеть и настройки userscript), «Внешние данные» (`fetchBlob` в
  userscript), «Структура» (адаптеры в `src/userscript/`), «Как работает» (контракты `HostNetwork` /
  `HostSettings` и адаптеры); README, раздел Tampermonkey: менеджер попросит гранты и доступ к хостам `@connect`,
  ключи из прошлой версии переносятся сами; проверка: `pnpm lint` зелёный (prettier по md)

## 7. Проверка

- [x] 7.1 `pnpm lint` и `pnpm test` — зелёные, 0 warnings в новом коде
- [x] 7.2 Стенд `dev/harness.html` (скрипт подключён без менеджера): кнопка появляется, вкладка GIF и сохранение
  настроек работают через `fetch` и `localStorage`, ошибок в консоли нет
- [ ] 7.3 Живой amo, Tampermonkey в Chrome, сборка 0.7.0 поверх 0.6.0 с сохранёнными ключами: ключи на вкладке
  «Настройки» без повторного ввода, ключа `amo-stickers:settings` в `localStorage` amo нет; импорт пака
  `video_gachi` доходит до конца без ошибок CORS, импортированный стикер и GIF из поиска GIPHY отправляются
- [ ] 7.4 Там же, в консоли страницы: `typeof GM_xmlhttpRequest` и `typeof GM_getValue` — `undefined`; в консоли
  отмечено, запустился ли Worker кодирования GIF или сработал фолбэк (`console.warn`); результат записан в
  design.md, раздел Risks
- [ ] 7.5 Violentmonkey в Chrome: кнопка появляется, импорт одного пака Telegram проходит; при расхождении с
  Tampermonkey — запись в design.md, раздел Risks
