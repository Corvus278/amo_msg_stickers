## Why

В userscript импорт пака Telegram падает на скачивании файлов стикеров (issue #15). Userscript ходит в сеть прямым
`fetch` со страницы и подчиняется её CORS: методы Bot API (`getStickerSet`, `getFile`) отдают
`Access-Control-Allow-Origin`, а скачивание файла (`api.telegram.org/file/bot…`) его не отдаёт, и браузер блокирует
ответ. В расширении такой проблемы нет: там сеть идёт через service worker.

Кроме того, userscript работает с `@grant none` в мире страницы и хранит токен бота и ключи GIF в `localStorage` amo.
И то и другое доступно любому скрипту страницы. Для доступа к сети в обход CORS всё равно нужен `@grant`, и вместе с
ним открываются изолированный мир и хранилище менеджера, недоступное странице.

## What Changes

- Userscript ходит в сеть через `GM_xmlhttpRequest` / `GM.xmlHttpRequest` менеджера: это запрос из фона менеджера,
  CORS страницы на него не действует. `@connect` в заголовке перечисляет разрешённые хосты: `api.telegram.org`,
  `giphy.com`, `klipy.com`.
- Сетевая политика `core/net.ts` для этого пути сохраняется: адрес проверяется до запроса и после редиректа (по
  итоговому адресу ответа), не-2xx ответ даёт ошибку с кодом и началом тела, тело читается с лимитом `maxBytes`
  (заведомо большой `Content-Length` и превышение по ходу загрузки обрывают запрос). Запросы уходят без cookie
  целевых сайтов.
- Userscript запускается в изолированном мире менеджера (`@sandbox DOM`, `@inject-into content`), как content script
  расширения: DOM amo общий, но JS страницы не видит ни код ядра, ни GM API.
- Настройки userscript хранятся в хранилище менеджера (`GM_getValue` / `GM_setValue`), а не в `localStorage`
  страницы. Настройки, уже сохранённые в `localStorage`, при первом чтении переносятся в хранилище менеджера и
  удаляются из `localStorage`.
- Без GM API (скрипт подключён на страницу напрямую, без менеджера) userscript ведёт себя как сейчас: прямой `fetch`
  и `localStorage`.
- Разводка режимов не трогает ядро: оно работает через контракты сети и хранилища настроек (`Host` делится на
  `HostNetwork` и `HostSettings`), а режимы userscript — отдельные адаптеры к ним. Адаптеры выбираются и
  собираются в `Host` только в точке входа userscript. Импорт из `src/userscript/` и `src/extension/` в
  `src/core/` запрещён правилом eslint.
- Заголовок userscript: `@grant none` заменяется на гранты сети и хранилища, добавляются `@connect`, `@sandbox`,
  `@inject-into`. Версия поднимается до 0.7.0.

## Capabilities

### New Capabilities

Нет.

### Modified Capabilities

- `runtime-hosts`: требование «Сетевые запросы в обход CORS страницы» распространяется на userscript (запросы
  через GM API менеджера, те же правила политики); требование «Userscript» получает изолированный мир и работу без
  GM API; требование «Настройки» меняет хранилище userscript на хранилище менеджера с переносом из `localStorage`.

## Impact

- Код: `core/host.types.ts` (разделение `Host` на контракты, только типы), адаптеры сети и настроек в
  `src/userscript/`, `src/userscript/index.ts` (выбор адаптеров и сборка `Host`, объявления GM API в модуле),
  заголовок userscript в `build.mjs`, правило `no-restricted-imports` в `eslint.config.mjs`.
- `core/net.ts`: переиспользуются `isAllowedUrl` и формат ошибок; логика `fetchChecked` / `readResponseLimited`
  привязана к `Response`, поэтому для GM-ответа нужны общие хелперы проверки (разбор без изменения поведения
  расширения).
- Тесты: новый юнит-тест сети через GM API (мок `GM_xmlhttpRequest`) и переноса настроек.
- Пользователи userscript: после обновления менеджер покажет новые разрешения (гранты и `@connect`), Tampermonkey
  может спросить о доступе к хостам при первом запросе.
- Версия в трёх местах: `package.json`, `src/extension/manifest.json`, `@version` в `build.mjs`.
