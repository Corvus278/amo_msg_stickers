## 1. Общий протокол и границы

- [x] 1.1 Перенести `src/core/guards.ts` в `src/shared/guards.ts`, поправить 5 импортов; «Структура» в CLAUDE.md;
  проверка — `pnpm lint`, `pnpm test` зелёные, `grep -rn "core/guards" src tests` пуст
- [x] 1.2 `src/shared/pageBridge.ts` + `pageBridge.types.ts` по design.md, п. 3: имена событий и атрибутов, запрос
  `{ id, op: 'send' }`, ответ `accepted` / `rejected` с `reason`, гарды разбора JSON-строки `detail` через `isObject`
  (каркас `parseJson` / `detailOf` / гарды — референс `send-with-draft`, `bridge.ts`, `bridge.types.ts`); проверка —
  `tests/pageBridge.test.ts`: валидные запрос и ответ, неизвестный `op`, `id` не строка и длиннее 64, `reason` не
  строка, не-JSON, `detail` не строка — не проходят, лишние поля не попадают в результат
- [x] 1.3 eslint `no-restricted-imports` по design.md, п. 1: `src/shared/**` — ничего вне `src/shared/`, `src/page/**` —
  только `src/page/` и `src/shared/`; комментарий к границе ядра и `host.types.ts` — ядро связано с окружением через
  `Host` и протокол агента; раздел «Линтинг» CLAUDE.md; проверка — временный импорт `../core/app` из `src/page/` и
  `../core/net` из `src/shared/` роняет `pnpm lint`, после удаления — чисто

## 2. Агент в мире страницы

- [x] 2.1 `src/page/findClient.ts` — поиск `{ reduxStore, sendRequest }` по fiber от элемента (`__reactFiber$`,
  `.return`, `alternate`, предел 200; каркас — референс `attachments.ts`), по design.md, п. 4; проверка —
  `tests/pageFindClient.test.ts` на новом `tests/helpers/fakeFiber.ts`: провайдер на глубине, только на `alternate`,
  нет ключа, нет провайдера, петля `.return`, `value` без `getState`
- [x] 2.2 `src/page/buildMessage.ts` с приватным uuid v1 — сообщение или причина отказа по design.md, п. 5; проверка —
  `tests/pageBuildMessage.test.ts`: время из uuid по RFC 4122 равно `now`, версия и вариант
  uuid, поля сообщения для `user` / `chat` / `lead`, без `refersTo`, без типа пира — `no-conversation`, `/settings/…` и чат вне
  `dialogs` — `no-conversation`, тип `subject` — `unsupported-conversation`, `media.id === localPhotoSize.localFileId`
  и производный от id сообщения
- [x] 2.3 `src/page/agent.ts` (слушатель: гарды, флаг `window.__amoStickersPage` в `src/types.d.ts`, поиск цели и
  `<input>` по атрибуту со сравнением `getAttribute`, синхронный ответ до вызова `sendRequest`, причины отказа) и точка
  входа `src/page/index.ts`; проверка — `tests/pageAgent.test.ts` на `tests/helpers/fakeDocument.ts` (из референса,
  на базе `CountingEventTarget`, с `body` и `append` / `remove`): успешный `send` — `accepted` приходит до возврата
  `dispatchEvent` и `sendRequest` вызван с одним сообщением; нет цели, файла, провайдера, чата — `rejected` с причиной
  и без `sendRequest`; невалидная команда — без ответа; второй запуск не заводит второго слушателя; в ответе только
  `id`, `status`, `reason`

## 3. Сборка и подключение

- [x] 3.1 `build.mjs`: плагин `gif-worker` обобщить в фабрику виртуального модуля с кодом бандла (модуль, вход, имя
  экспорта, `watchFiles`, `minify` в сборке) и собрать ею `gif-worker:code` и `page-agent:code`; точка входа
  `src/page/index.ts` → `dist/extension/page.js`; `declare module 'page-agent:code'` в `src/types.d.ts`;
  `manifest.json` — запись `content_scripts` с `"world": "MAIN"`; раздел «Сборка CSS и Worker-а» CLAUDE.md; проверка —
  `pnpm build`: в сборочном `manifest.json` две записи, `page.js` меньше 10 КБ, конвертация на стенде работает
  (Worker собран той же фабрикой)
- [x] 3.2 Userscript: `src/userscript/pageAgent.ts` — внедрение строки агента `<script>` с удалением элемента, вызов из
  `index.ts` до `start()`; «Окружения и адаптеры» CLAUDE.md; проверка — тест в `tests/userscriptEntry.test.ts`: агент
  внедрён до `start()`, элемента в DOM после внедрения нет; `pnpm test`

## 4. Отправка в ядре

- [x] 4.1 Клиент моста `src/core/pageClient.ts`: пометка поля ввода и `<input>` с файлом, команда `send`, первый
  валидный ответ с нужным `id` к возврату из `dispatchEvent` (нет — `no-agent`), уборка узлов и слушателя сразу; проверка —
  `tests/pageClient.test.ts` на фейковом документе: агента нет → `unavailable` (`no-agent`) сразу, `rejected` → `unavailable`
  с причиной, `accepted` → принят, чужой `id` и битый JSON игнорируются, после исхода нет помеченных узлов и слушателей
- [x] 4.2 `sender.ts`: `sendFile(composer, file, pageClient)` по design.md, п. 6 — очередь, при `unavailable`
  `console.info` и внутренний `sendViaPaste` (нынешний код без изменений); `app.ts` передаёт клиент, остальное в нём
  не меняется; раздел «Отправка» CLAUDE.md; проверка — `tests/sender.test.ts` с фейковым клиентом: после `accepted`
  paste не диспатчится и «Отправить» не нажимается, при `unavailable` — прежнее поведение, включая `SendError` при
  тексте в поле

## 5. Стенд

- [x] 5.1 `dev/harness.html` по design.md, п. 8: поддельный провайдер в `__reactFiber$harness` поля ввода, store с
  `location` и `dialogs`, `sendRequest` кладёт в ленту картинку из `media.file` с `alt` = `fileName`; переключатель
  «очередь amo»; описание стенда в CLAUDE.md; проверка — на стенде: с текстом и вложением в поле стикер уходит в ленту
  без пузыря, поле не меняется, стикер в недавних; «очередь amo» выключена — при пустом поле стикер уходит вставкой,
  при тексте — ошибка черновика; двойной клик — одно сообщение

## 6. Версия и приёмка

- [x] 6.1 Версия 0.15.0 в `package.json`, `src/extension/manifest.json`, `@version` в `build.mjs`; проверка —
  `node scripts/check-version.mjs --base origin/master` проходит
- [x] 6.2 Проверки: `pnpm lint`, `pnpm test`, `pnpm build` зелёные (вывод в отчёте)
- [x] 6.3 Приёмка в живом amo (руками, расширение и userscript в Tampermonkey; Violentmonkey и Safari — по
  возможности): критерии issue #61 — «привет» и картинка в поле, direct, group chat, чат с клиентом, активный ответ,
  редактирование; в консоли нет ошибок агента; результат — в отчёте и описании PR. Пройдено 2026-09-30: расширение —
  все сценарии, GIF из поиска, консоль без ошибок; userscript в Tampermonkey при выключенном расширении —
  `started (userscript)`, `__amoStickersPage === true`, стикер при тексте с картинкой и при пустом поле, без
  `amo queue unavailable`. Violentmonkey и Safari не проверялись. Сообщение попадает в `state.messages` синхронно, в
  вызове `sendRequest`.
