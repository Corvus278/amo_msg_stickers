## Context

Мотивация — proposal.md, «Why». Ссылки `web:` — исходники amo web (`~/web`, коммит 778645b7f, React 18.3.1).

**Как amo отправляет в обход поля ввода.** Опрос: `pollMethods.sendPoll` → `pushMessagesRegularBuild` →
`makeHackyRequest({ requestType: 'sendNewMessages' })({ messages })` (`web: src/state/services/poll/poll.service.ts:21-38`,
`src/state/modules/messages/operations.js:735-755`). `makeHackyRequest` — обёртка над `sendRequest({ type, payload })`,
который кладёт запрос в канал redux-saga (`web: src/back/modules/ui/configureUiControllers.js:52-63`): через
`store.dispatch` его не вызвать. Дальше `sendNewMessagesController` ставит сообщение в очередь чата
(`sendNewMessagesController.js:37`), интерактор забирает `media.file` (`sendNewMessagesInteractor.js:24-27`), репозиторий
для `localFlag: PREPARING` считает размеры (`messages.repository.ts:897-925`), загружает файл (`:980`) и отправляет
`sendMedia` (`messagesServer.source.js:44-65`). GIF не перекодируется: `PHOTO_MEDIA_MIME_TYPES_WITHOUT_PROCESSING =
['image/gif']` (`web: src/back/domain/entities/media/media.constants.ts:52`), `fileName` доходит до `alt`
(`Photo.component.tsx:74`).

**Доступ снаружи.** `sendRequest` и `reduxStore` лежат в значении `ReactClientContext.Provider` — одном объекте на
модуль (`web: src/reactClient/ReactClientProvider.jsx:6,19-29`). Корень React один (`web: src/index.tsx:18-30`), поле
ввода сообщений одно — `<Compose>` в `ConversationRoute` (`ConversationRoute.component.jsx:404`), поэтому провайдер
достижим по `.return` от поля ввода. Прод-сборка поля не манглит.

**Проверка в живом amo** (сниппет из DevTools, 2026-09-28, direct-чат): провайдер найден на глубине 40 fiber;
сообщение прошло `PREPARING → NONE (w=96) → UPLOADED → sendMedia` за 241 мс; `sendRequest` вернул `undefined`; в поле
остались «привет» и картинка; в ленте `img[alt="test.amostk.k-sticker.gif"]` 96×96. Локальный id исчез из
`state.messages` на +275 мс.

**Ограничения проекта.** Ядро — изолированный мир (content script; userscript — `@sandbox DOM`, `@inject-into
content`, `build.mjs:66-72`); требование изоляции — `openspec/specs/runtime-hosts/spec.md`, «Userscript». `Host` — сеть
и настройки. MAIN-world скрипта сейчас нет.

## Goals / Non-Goals

**Goals:**

- ядро не выходит в мир страницы; там только агент в несколько килобайт, без кода ядра;
- один протокол агента для расширения и userscript: одна команда, один ответ, синхронно;
- поиск провайдера и сборка сообщения — чистые функции с юнит-тестами; правило «без двойной отправки» — тест
  `sender.ts`;
- `app.ts` не меняется: путь выбирает `sender.ts`, недавние пишутся как сейчас — после `await` отправки.

**Non-Goals:**

- отправка в чат, отличный от открытого (пересылка, выбор чата);
- подпись к стикеру, ответ на сообщение стикером;
- Firefox-расширение (спека — только Chrome MV3); userscript в Firefox — через тот же DOM-путь, без `cloneInto`;
- слежение за исходом загрузки и свой показ ошибки после приёма в очередь — это делает amo.

## Decisions

### 1. Агент в мире страницы, ядро остаётся изолированным

В мире страницы работает `src/page/` — агент: принимает команду, находит провайдер, собирает сообщение, вызывает
`sendRequest`. Ядро шлёт команду клиентом моста из `sender.ts`.

- *Альтернатива — ядро целиком в мире страницы* (`@sandbox raw`, `@inject-into page`, `@grant none`): отпадает — ломает
  требование изоляции (ключи GIF и токен бота стали бы доступны странице), а в Safari Userscripts и Violentmonkey в
  режиме page пропадают GM API.
- *Альтернатива — `sendConversationDraught` с `attachments`*: отпадает — удаляет сохранённый черновик и забирает
  активный ответ (`web: messages.repository.ts:1130-1174`).

**Границы модулей.** Протокол нужен обоим мирам, поэтому живёт в нейтральном `src/shared/` (`pageBridge.ts`,
`pageBridge.types.ts`); туда же переезжает `core/guards.ts` (`isObject`, 5 импортёров) — он нужен гардам протокола.
eslint `no-restricted-imports`: `src/shared/**` не импортирует ничего вне `src/shared/`; `src/page/**` — только
`src/page/` и `src/shared/`; у `src/core/**` запрет на окружения остаётся. Исключений в правилах нет, и в строку
агента не утянется ядро.

**Контракт ядра с окружением** — теперь `Host` и протокол агента: окружение обязано подключить агента, иначе работает
запасной путь. Это пишется в `host.types.ts`, в комментарии к границе в `eslint.config.mjs` и в CLAUDE.md. В `Host`
отправка не входит: протокол у обоих окружений одинаковый, различается только разовое подключение агента при старте.

### 2. Подключение агента

- **Расширение:** вторая запись `content_scripts` с `"world": "MAIN"`, `run_at: document_idle`, файл `page.js` —
  отдельная точка входа esbuild. Своим файлом: CSP страницы к нему не применяется, разрешений не прибавляется.
- **Userscript:** код агента — строка из виртуального модуля `page-agent:code`. Плагин `gif-worker`
  (`build.mjs:168-209`) обобщается в фабрику виртуального модуля с кодом бандла (модуль, вход, имя экспорта), и оба
  модуля собираются ею. `src/userscript/index.ts` до `start()` вставляет строку элементом `<script>` и сразу удаляет его:
  DOM у миров общий, и скрипт выполняется в мире страницы у всех менеджеров и на стенде без менеджера.
- Сейчас у amo CSP нет: ни в `web: public/index.html`, ни в `nginx/nginx.conf:20-21`, ни в заголовках корня
  `web.amo.tm`, а сам `index.html` держит inline-`<script>` (`:22-32`). `GM_addElement` обошёл бы будущий CSP в
  Tampermonkey и Violentmonkey, но сегодня ничего не даёт — не берём (см. «Risks»).
- Повторное подключение: агент ставит флаг `window.__amoStickersPage` (объявлен рядом с `__amoStickers` в
  `src/types.d.ts`) и второй раз слушателя не заводит.
- Порядок загрузки не важен: готовность не проверяется отдельно, отсутствие ответа на `send` и есть «агента нет».

*Альтернатива — `blob:` URL или `unsafeWindow`*: не проверены в менеджерах, `unsafeWindow` в изолированном мире Chrome
не даёт `window` страницы.

### 3. Протокол: одна команда, один синхронный ответ, файл через DOM

- **Команда и ответ** — `CustomEvent` на `document`: `amo-stickers:page-request` и `amo-stickers:page-response`,
  `detail` — JSON-строка. `CustomEvent`, а не `postMessage`: его не слышат другие фреймы. Строка, а не объект: у
  Firefox Xray объект из content-мира страница не прочтёт без `cloneInto`. `detail` читается через `in`, а не
  `instanceof`: у события из другого мира свой конструктор (каркас — референс `send-with-draft`, `bridge.ts`).
- **Запрос** — `{ id, op: 'send' }`; `id` — строка до 64 символов, по нему ядро сопоставляет ответ.
- **Файл** — в скрытом `<input type="file" data-amo-stickers-file="<id>">` в `body`, `input.files =
  dataTransfer.files`. DOM-объекты у миров общие — тот же механизм, что у рабочего `paste` (`src/core/sender.ts:44-55`):
  файл не копируется и не сериализуется. Цель — поле ввода с `data-amo-stickers-target="<id>"`: агент идёт по fiber от
  него. Агент находит оба узла `querySelectorAll` по имени атрибута и сравнивает значение `getAttribute` с `id` —
  значение в селектор не подставляется.
- **Ответ** — один: `{ id, status: 'accepted' }`, когда сообщение собрано и `sendRequest` вызван, или `{ id, status:
  'rejected', reason }`, где `reason` — строка для консоли (`no-target`, `no-client`, `no-conversation`,
  `unsupported-conversation` и т. п.; перечнем в протоколе не закрепляются). До ответа агент делает только синхронную
  работу — гарды, поиск по fiber, `getState`, сборку объекта, — поэтому ответ приходит внутри `dispatchEvent` ядра.
  Невалидная команда — без ответа. Текстов ошибок из мира страницы нет, язык интерфейса знает ядро.
- **Уборка:** ядро удаляет `<input>` и снимает пометку поля сразу после `dispatchEvent` — файл дальше держит amo
  (`sendingMessagesFiles`, `sendNewMessagesInteractor.js:26`).
- Файл агент не проверяет: ядро уже проверило его (`toCheckedGifFile`, конвертация), а против скрипта страницы
  проверка ничего не даёт — он может вызвать `sendRequest` сам (п. 7).
- *Альтернатива — `Blob` в `detail`*: исходники Blink говорят, что `CustomEvent.detail` клонируется между мирами
  (`custom_event.cc:50,71`), но вживую не проверено, а в Firefox не работает без `cloneInto`.

### 4. Поиск провайдера

Ключ `__reactFiber$…` поля ввода, дальше по `.return`; на каждом fiber смотрим и его `alternate` — у текущего дерева
`memoizedProps` может лежать на копии (каркас — референс `send-with-draft`, `attachments.ts`). Подходит значение
`memoizedProps.value` с функцией `sendRequest` и объектом `reduxStore` с `getState`. Предел — 200 шагов. Без кэша:
значение провайдера — синглтон модуля amo (`ReactClientProvider.jsx:6,20-22`), кэш ничего не сэкономил бы на ~40
шагах, а добавил бы состояние.

### 5. Сборка сообщения — по `buildRegularMessages`

Чистая функция `(state, file, now, random) → message | reason` в `src/page/buildMessage.ts` вместе с приватным uuid
v1, повторяющая объект из `web: operations.js:682-726`:

- `conversationId` — `state.location.payload.selectedConversationId` при `location.type === 'conversation'`
  (на `/settings/…` селектор отдал бы имя страницы — `web: location/selectors.js:71-79`); чат должен быть в
  `state.dialogs` (модуль `dialogs`, `web: root.constants.ts:68`);
- `conversationType` — из `state.dialogs[id].conversationType`, как `operations.js:588`; записи без типа —
  `no-conversation`, а не подстановка `user` по умолчанию, как у amo: угаданный тип хуже запасного пути (тип в адресе — другой
  набор: `direct` ≠ `user`, `web: location/constants.ts:7-14`); поддерживаются типы, которые знает `mapRequestPeer`:
  `user`, `bot`, `chat`, `lead`, `request`, `client`, `folder` (`web: requestMappers.ts:250-286`); иначе
  `unsupported-conversation` и запасной путь;
- `flags: [MESSAGE_FLAGS.OUT]` (`2`), `from: { memberSelf: {} }`, `to: { memberAll: {} }`, `fromMember` / `toMember` —
  как у сообщения без упоминания (`operations.js:619-646`); `message: ''`, без `refersTo`;
- `id` — uuid v1 с node `0123456789ab` (`web: src/utils/uuidv1.js:7,14-19`), `idempotencyKey: id`, `date` — время из
  `id`; время локальное, у amo — `SyncDate.server()` (сниппет прошёл с локальным);
- `media` — фото как у `createPreparingLocalMediaWithFile` (`web: media.operations.ts:100-110`): `id` =
  `localPhotoSize.localFileId` = `amostk-<id сообщения>`: amo id медиа не разбирает — это ключ файла в очереди
  (`sendNewMessagesInteractor.js:26`), и сам amo строит его то с `lastModified`, то с `Date.now()`
  (`media.operations.ts:77`, `userImport.service.ts:98`), — поэтому копия `generateMediaId` не нужна;
  `localFlag: 1` (PREPARING), `mediaType: 'photo'`, `file`. Равенство `media.id` и `localFileId` обязательно: иначе
  упавшее сообщение UI удалит само (`web: RegularMessage.component.jsx:361-371`), а загрузка не найдёт файл.

### 6. Выбор пути и защита от двойной отправки — в `sender.ts`

`sendFile(composer, file, pageClient)` — единственная функция отправки, `app.ts` зовёт её как сейчас. Внутри:
`pageClient.send(composer, file)` → `accepted` — готово; `rejected` или нет ответа к возврату из `dispatchEvent` — `console.info` с
причиной и прежний код вставки, выделенный во внутренний `sendViaPaste` без изменений. Клиент — параметр, как адаптеры
userscript, поэтому `tests/sender.test.ts` проверяет с фейковым клиентом: после `accepted` вставки нет, после
`rejected` и отсутствия агента — есть.

**Успех = amo принял сообщение**, одинаково на обоих путях: для очереди — `accepted`, для вставки — клик «Отправить».
Поток `app.ts` остаётся линейным (`await sendFile; await pushRecent`), попап закрывается по резолву `onSend`.
Исход загрузки ядро не ждёт: `sendRequest` при ошибке всё равно отдаёт `undefined`
(`sendNewMessagesInteractor.js:41-44`, `sendNewMessagesController.js:46-51`), а неудачу показывает лента amo с повтором.
Стикер, упавший при загрузке, попадает в недавние — так же, как сегодня на пути вставки.

*Альтернатива — ждать исход в store* (подписка, поиск по `idempotencyKey`, финальные `sent`/`failed`/`pending`,
таймауты 60 и 90 с): отпадает — ради одного решения о недавних два таймаута, второй промис, O(N) по `state.messages` на
каждый диспатч store и опора на внутренние поля amo `failed`, `isLocal`.

### 7. Модель угроз

Мир страницы — это amo и всё, что в нём выполняется. Что может сторонний скрипт страницы:

- **послать агенту команду** — агент отправит файл, который скрипт сам положил в `<input>`, в открытый чат: то же, что
  скрипт может сделать сам через `sendRequest`; повышения прав нет;
- **читать события и `<input>`** — видит статус, причину отказа и файл стикера, который и так уходит в чат; содержимого
  поля ввода, настроек, ключей и токена в протоколе нет;
- **подделать ответ** — например, `rejected` раньше агента, и ядро пойдёт запасным путём; при непустом поле его
  остановит защита черновика, при пустом — возможен второй стикер. Это уровень доверия к самой странице: скрипт
  страницы и без того может нажать «Отправить». Ядро принимает только первый ответ с нужным `id` и валидной формой.

### 8. Стенд

`dev/harness.html` получает поддельный провайдер: объект `{ reduxStore, sendRequest }` в `__reactFiber$harness` поля
ввода с `.return`, store с `location`, `dialogs` и `getState`. `sendRequest` кладёт в ленту стенда сообщение с
картинкой из `media.file` и `alt` = `fileName`. Переключатель «очередь amo»: выключен — провайдера нет, работает
запасной путь. Агент на стенде внедряется `<script>`, как в userscript; MAIN content script расширения стенд не
проходит — он проверяется в приёмке.

## Risks / Trade-offs

- [amo переименует `ReactClientContext`, модуль `dialogs` или форму сообщения] → `rejected` и запасной путь, в консоли
  причина; поиск и сборка покрыты тестами на форму, сверка с amo — по ссылкам в этом design.
- [amo поменяет форму так, что сообщение примется, но уйдёт битым] → видно в ленте сразу; запасной путь не спасёт —
  нужен выпуск с правкой. Приёмка — ручная проверка в живом amo по видам чатов.
- [amo включит CSP без `unsafe-inline`] → userscript уйдёт на запасной путь, расширение не затронуто. Лечение —
  `GM_addElement` для Tampermonkey и Violentmonkey (грант в заголовке и одна ветка во внедрении); Safari Userscripts
  CSP не обходит.
- [страница подделывает ответ агента] → см. «Модель угроз»: не хуже, чем доступ страницы к своей кнопке «Отправить».
- [стикер упал при загрузке, но попал в недавние] → как на пути вставки сегодня; повтор — из меню сообщения amo.
- [перезагрузка страницы до повтора упавшего стикера] → amo удалит неотправленное фото без файла — так же, как своё
  вложение (`web: RegularMessage.component.jsx:361-371`).
- [время uuid локальное, а не серверное] → в сниппете прошло; при большом расхождении часов порядок в ленте может
  отличаться до ответа сервера.

## Migration Plan

Миграции данных нет. Откат — выпуск предыдущей версии: запасной путь и есть прежнее поведение.
