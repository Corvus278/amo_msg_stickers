## Context

Мотивация — в proposal.md, раздел Why. Требования — в `specs/runtime-hosts/spec.md`.

Текущее состояние:

- `src/userscript/index.ts` — `Host` userscript: сеть через `fetchChecked` и `readResponseLimited` из `core/net.ts`
  прямым `fetch`, настройки в `localStorage` под ключом `amo-stickers:settings`. Заголовок в `build.mjs` —
  `@grant none`, поэтому скрипт выполняется в мире страницы.
- `core/net.ts`: политика адресов (`isAllowedUrl`), лимит потока (`readLimited`, `readResponseLimited`), проверка
  после редиректа и ошибка `HTTP <код> <начало тела>` (`fetchChecked`). Всё, кроме `isAllowedUrl`, привязано к
  `Response` из `fetch`, а ответ `GM_xmlhttpRequest` — это не `Response`.
- Незаархивированный `harden-core-security` добавляет в `runtime-hosts` требования «Сетевая политика» и «Лимит размера
  загрузки» для обоих окружений. Эта дельта их не меняет: путь через GM API обязан им соответствовать как есть.
- Двойной запуск ядра отсекает флаг `window.__amoStickers`, а двойную кнопку — DOM-метка `data-amo-stickers` в
  `app.ts`. Метка работает между мирами: DOM общий.

## Goals / Non-Goals

**Goals:**

- Сеть userscript через `GM_xmlhttpRequest` с теми же гарантиями, что у `fetchChecked` + `readResponseLimited`.
- Изолированный мир в Tampermonkey и Violentmonkey.
- Настройки в хранилище менеджера с однократным переносом из `localStorage`.
- Работа без GM API (скрипт подключён напрямую) — как сейчас.
- Логика сети и переноса настроек покрыта юнит-тестами без реального менеджера.
- Ядро не меняет поведения и не знает о режимах userscript: оба режима — адаптеры к контрактам ядра.

**Non-Goals:**

- Greasemonkey 4 и прочие менеджеры только с промис-API `GM.*`: проект нацелен на Chromium, а у `GM.xmlHttpRequest`
  нет единого способа оборвать запрос на лимите. Без `GM_xmlhttpRequest` скрипт работает через `fetch` — с тем же
  ограничением по CORS, что и сейчас.
- Поведение расширения: `background.ts` и `content.ts` не меняются.
- Таймауты запросов: у `fetch` их сейчас тоже нет.

## Decisions

### Сеть — `GM_xmlhttpRequest`, а не `GM.xmlHttpRequest` и не `responseType: 'stream'`

`GM_xmlhttpRequest` с колбэками есть в Tampermonkey, Violentmonkey и ScriptCat. Вызов возвращает объект с
`abort()`, поэтому загрузку можно оборвать на лимите. Промис-форма `GM.xmlHttpRequest` в разных менеджерах
по-разному отдаёт `abort`, а `responseType: 'stream'` (тогда подошёл бы `readLimited`) есть только в Tampermonkey.

Лимит `fetchBlob(url, maxBytes)` соблюдается тремя проверками, и любая из них вызывает `abort()` и ошибку
«Файл больше N МБ»:

1. `onreadystatechange` на `HEADERS_RECEIVED`: `Content-Length` из `responseHeaders` больше лимита — обрыв до
   чтения тела (аналог проверки в `readResponseLimited`).
2. `onprogress`: `loaded` больше лимита — обрыв по ходу загрузки, если сервер не прислал или занизил размер.
3. `onload`: `response.byteLength` больше лимита — страховка, если менеджер не прислал `progress`.

Тело бинарного ответа — `responseType: 'arraybuffer'`, JSON — `responseType: 'text'` с `JSON.parse` в адаптере:
текст нужен и для ошибки не-2xx, а `responseType: 'json'` в менеджерах отдаёт `null` на битом теле, и причина
теряется.

Запрос уходит с `anonymous: true`: без cookie целевых сайтов, как `fetch` из content script с `credentials` по
умолчанию для чужого origin. Ответу без этого флага стали бы доступны cookie пользователя на `giphy.com` и
`telegram.org`, хотя им там нечего делать.

### Проверки политики — общие хелперы `core/net.ts`

Из `core/net.ts` экспортируются уже существующие `assertAllowedUrl` и `NOT_ALLOWED`, а также `tooBigError`. Ошибку
`HTTP <код> <начало тела>` из `fetchChecked` выносим в экспортируемый хелпер (`httpError(status, body)`), и
`fetchChecked` зовёт его же. Поведение расширения не меняется, а тексты ошибок у двух путей совпадают по
построению.

Итоговый адрес — `finalUrl` ответа менеджера (или адрес запроса, если менеджер его не прислал). Он проверяется
`isAllowedUrl` до разбора тела. Если адрес вне политики — `abort()` и ошибка `NOT_ALLOWED`. Менеджер следует
редиректу сам, поэтому запрос к чужому хосту после редиректа уже ушёл, как и у `fetch`. Политика гарантирует
другое: данные чужого хоста не попадают в ядро.

Тексты ошибок `onerror` / `ontimeout` / `onabort` не содержат адреса: в пути запросов к Telegram лежит токен бота.

### Ядро и адаптеры: ядро знает только контракты

Ядро не знает ни о GM API, ни о том, как подключён userscript. Оно работает через контракты из
`core/host.types.ts`, а окружения подключают к ним свои адаптеры.

- `Host` делится на два контракта: `HostNetwork` (`fetchJson`, `fetchBlob`) и `HostSettings` (`getSettings`,
  `setSettings`), `Host = { name } & HostNetwork & HostSettings`. Меняются только типы: потребители ядра и
  `extension/content.ts` не трогаются, jsdoc полей переезжает в контракты.
- Адаптеры userscript, каждый — чистая функция, зависимости передаются параметрами (так их тестируют без менеджера):
  - `src/userscript/gmNetwork.ts` — `gmNetwork(request): HostNetwork`, где `request` — функция с сигнатурой
    `GM_xmlhttpRequest`. Тест подставляет мок, который вызывает колбэки в нужном порядке;
  - `src/userscript/fetchNetwork.ts` — `fetchNetwork(): HostNetwork`, нынешняя сеть userscript на `fetchChecked` и
    `readResponseLimited` без изменений;
  - `src/userscript/settings.ts` — `gmSettings(gmStore, storage): HostSettings` (хранилище менеджера с переносом из
    `storage`) и `localStorageSettings(storage): HostSettings` (нынешнее поведение); `storage` — срез `Storage`
    (`getItem`, `setItem`, `removeItem`).
- `src/userscript/gm.types.ts` — минимальные типы используемой части GM API: детали запроса, ответ, handle с
  `abort`, `GM_getValue` / `GM_setValue`.
- `src/userscript/index.ts` — единственное место выбора режима: `typeof GM_xmlhttpRequest === 'function'` —
  `gmNetwork`, иначе `fetchNetwork`; `typeof GM_getValue === 'function'` — `gmSettings`, иначе
  `localStorageSettings`. Из выбранных адаптеров собирается `Host` с `name: 'userscript'` в обоих режимах и уходит в
  `start(host)`.
- `GM_*` объявлены через `declare const` внутри модуля `src/userscript/index.ts`, а не в глобальном
  `src/types.d.ts`. Объявление в модуле видно только ему, поэтому ядро не может сослаться на GM API даже по ошибке.
  Менеджер кладёт `GM_*` в область видимости скрипта, а не в `window`, поэтому проверка идёт через `typeof`, а не
  `window.GM_…`.
- Границу держит eslint: `no-restricted-imports` для `src/core/**` запрещает импорт из `src/userscript/` и
  `src/extension/`. Правило добавляется, существующие не ослабляются.

Альтернатива — `@types/tampermonkey`. Отказались: новая зависимость ради трёх функций, к тому же типы описывают
только Tampermonkey, а нужен общий срез менеджеров.

Альтернатива — выбирать режим внутри одного адаптера (`if (GM) … else …` в каждом методе). Отказались: ветвление
расползается по методам, а замена одного адаптера (например, другой менеджер) задевает оба пути.

### Изолированный мир — `@sandbox DOM` и `@inject-into content`

`@sandbox DOM` (Tampermonkey) и `@inject-into content` (Violentmonkey) запускают скрипт в изолированном мире, как
content script расширения. DOM, IndexedDB и `localStorage` origin amo общие со страницей, JS-глобалы — нет. Путь
отправки (paste `DataTransfer` + клик) из изолированного мира уже проверен расширением. Менеджер, не знающий
директиву, её игнорирует.

Альтернатива — JS-песочница Tampermonkey по умолчанию: скрипт в realm страницы с прокси `window`. Отказались:
страница может подменить `JSON.parse`, `Blob` или `Promise` до старта скрипта и прочитать токен и ответы.

### Заголовок userscript

```
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api.telegram.org
// @connect      giphy.com
// @connect      klipy.com
// @sandbox      DOM
// @inject-into  content
```

`@connect` в Tampermonkey пропускает домен вместе с поддоменами — этого хватает для CDN GIPHY и KLIPY. Точность
хоста `api.telegram.org` (без поддоменов) обеспечивает `isAllowedUrl`, а не `@connect`. Список `@connect` —
литерал в `build.mjs` рядом с `@match`; его соответствие `ALLOWED_HOSTS` / `ALLOWED_DOMAINS` сверяется вручную,
как у `host_permissions` в manifest.

### Настройки и перенос

Ключ в хранилище менеджера тот же — `amo-stickers:settings`, значение — объект `Partial<Settings>` (GM-хранилище
сериализует его само). Чтение: значение из менеджера есть — берём его. Нет — читаем `localStorage`; если там
разобрался JSON, пишем его в менеджер и удаляем ключ из `localStorage`. Битый JSON в `localStorage` удаляется без
переноса — как сейчас, где он даёт настройки по умолчанию. Запись идёт только в менеджер.

Перенос срабатывает на первом `getSettings` после обновления: пикер читает настройки при монтировании, поэтому
отдельного шага миграции при старте не нужно.

## Risks / Trade-offs

- [Worker кодирования GIF из blob URL в изолированном мире менеджера может не стартовать из-за CSP мира] →
  срабатывает штатный фолбэк на главном потоке (`console.warn`). На живом amo проверяем, какой путь реально
  работает; фолбэк — не регрессия функциональности.
- [Tampermonkey при первом запросе к хосту из `@connect` может спросить разрешение, а при обновлении — показать
  новые гранты] → в README описываем, что разрешить. Хосты в `@connect` — только из сетевой политики.
- [`onprogress` в каком-то менеджере не приходит] → третья проверка на `onload` не даёт отдать ядру больше лимита.
  Трафик при этом докачивается, но таких менеджеров среди целевых (Tampermonkey, Violentmonkey) нет.
- [Менеджер без `finalUrl`] → проверяется адрес запроса. Редирект на чужой хост в таком менеджере не ловится —
  тот же уровень, что `fetch` с пустым `res.url` в `fetchChecked`.
- [Пользователь откатился на старую версию после переноса] → старая версия не увидит настройки в `localStorage` и
  попросит ввести ключи заново. Данные не теряются, они в хранилище менеджера. Приемлемо.

## Migration Plan

1. Релиз 0.7.0: userscript обновляется менеджером (или вручную из релиза), менеджер показывает новые разрешения.
2. При первом открытии пикера настройки переезжают из `localStorage` в хранилище менеджера.
3. Откат — установка 0.6.0 из прошлого релиза. Ключи придётся ввести заново (см. Risks).
