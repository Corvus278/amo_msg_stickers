# План прогона: userscript-gm-network

База прогона: `857d969eef5e26666d4d2ae2d02bb420a0bb5d04`
Гейт: `pnpm lint && pnpm test && pnpm build`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest run --project=unit tests/<файл>.test.ts`
Долгие слои: `pnpm build` — G1 (версия), G3; стенд `dev/harness.html` в headless Chrome (среда — CLAUDE.local.md) — G3
Хук коммита: полный `pnpm typecheck` + `vitest --changed` — каждая группа оставляет типы зелёными; адаптеры G2 до G3
ни к чему не подключены, временной совместимости не нужно.

## Контракты

- **K1 Контракты Host** — `core/host.types.ts` экспортирует `HostNetwork` (`fetchJson`, `fetchBlob`) и `HostSettings`
  (`getSettings`, `setSettings`); `Host = { name } & HostNetwork & HostSettings`. Владелец G1; потребители G2, G3.
- **K2 Хелперы политики** — `core/net.ts` экспортирует `assertAllowedUrl`, `NOT_ALLOWED`, `tooBigError`,
  `httpError(status, body)`; `fetchChecked` строит ошибку только через `httpError`. Тексты: «Адрес вне списка
  разрешённых», «Файл больше N МБ», `HTTP <код> <тело ≤200>`. Адаптер G2 своих текстов ошибок политики не пишет.
  Владелец G1; потребитель G2.
- **K3 Типы GM** — `src/userscript/gm.types.ts` экспортирует тип функции с сигнатурой `GM_xmlhttpRequest` (параметр
  `gmNetwork`) и типы `GM_getValue` / `GM_setValue`; `declare const GM_*` — только в `src/userscript/index.ts`, в
  `src/types.d.ts` и `src/core/**` их нет. Владелец G2; потребитель G3.
- **K4 Граница ядра** — `src/core/**` не импортирует из `src/userscript/` и `src/extension/` (eslint
  `no-restricted-imports`); `rg -n "GM_" src/core` пусто. Владелец G1; потребители G2, G3.
- **K5 Версия 0.7.0** — одна и та же в `package.json`, `src/extension/manifest.json`, `@version` в `build.mjs`.
  Владелец G1; G3 правит заголовок `build.mjs`, строку `@version` не трогает.

## Группы

### G1 · Версия, контракты ядра, хелперы net, граница eslint · M · волна 1

- Задачи: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
- Зависит от: —
- Файлы: `package.json`, `src/extension/manifest.json`, `build.mjs` (строка `@version`), `src/core/host.types.ts`,
  `src/core/net.ts`, `tests/net.test.ts`, `eslint.config.mjs`, `CLAUDE.md` (раздел «Линтинг»)
- Требования: `runtime-hosts` → «Сетевые запросы в обход CORS страницы» (ошибки HTTP)
- Design: «Проверки политики — общие хелперы core/net.ts», «Ядро и адаптеры: ядро знает только контракты»
- Контракты: вводит K1, K2, K4, K5
- Усиление проверок: 1.1 — `git log master..HEAD` до первого коммита группы пуст
- Усиление проверок: 2.1 — `git diff --stat <база> -- src/core src/extension` показывает только `host.types.ts`
- Усиление проверок: 2.2 — `git diff <база> -- tests/net.test.ts tests/background.test.ts` без правок старых ожиданий
- Усиление проверок: 2.3 — тело 300 символов → ровно 200 в тексте; ошибка `fetchChecked` на 404 (`mockResponse`)
  совпадает с `httpError(404, body).message` — связывает хелпер с расширением
- Усиление проверок: 2.4 — временный импорт `../userscript/index` из `src/core/app.ts` и
  `../../../../extension/content` из вложенного `src/core/ui/**` — оба дают ошибку eslint; вывод — в отчёт

### G2 · Адаптеры сети userscript: GM API и fetch · M · волна 2

- Задачи: 3.1, 3.2, 3.3, 3.4
- Зависит от: G1
- Файлы: `src/userscript/gm.types.ts`, `src/userscript/gmNetwork.ts`, `src/userscript/fetchNetwork.ts`,
  `tests/gmNetwork.test.ts`, `tests/helpers/**` (новые хелперы мока GM, если нужны)
- Требования: `runtime-hosts` → «Сетевые запросы в обход CORS страницы» (сценарии «Ошибка HTTP в userscript»,
  «Сетевая политика в userscript», «Лимит размера в userscript»)
- Design: «Сеть — GM_xmlhttpRequest, а не GM.xmlHttpRequest…», «Проверки политики…», Risks (`finalUrl`, `onprogress`)
- Контракты: потребляет K1, K2, K4; вводит K3
- Усиление проверок: 3.3 — мок вызывает `onabort` синхронно из `abort()`: ошибка остаётся «Файл больше», промис
  не переразрешается; во всех трёх лимит-кейсах `abort` вызван
- Усиление проверок: 3.3 — `finalUrl` вне политики при валидном JSON-теле всё равно ошибка; адрес вне политики —
  `expect(request).not.toHaveBeenCalled()`
- Усиление проверок: 3.3 — URL запроса содержит `bot123:SECRET`, тексты `onerror` / `ontimeout` без `SECRET`;
  `responseHeaders` с `Content-Length` / `Content-Type` в разном регистре; ошибка 404 равна `httpError(...)`
- Усиление проверок: 3.4 — построчная сверка с `git show <база>:src/userscript/index.ts`: те же вызовы
  `fetchChecked` / `readResponseLimited`, тот же тип Blob

### G3 · Настройки, точка входа, заголовок, документация · M · волна 3

- Задачи: 4.1, 4.2, 5.1, 5.2, 6.1, 7.1, 7.2
- Зависит от: G1, G2
- Файлы: `src/userscript/settings.ts`, `tests/userscriptSettings.test.ts`, `src/userscript/index.ts`, `build.mjs`
  (заголовок userscript), `CLAUDE.md`, `README.md`
- Требования: `runtime-hosts` → «Настройки» (перенос, «Настройки недоступны странице»); «Userscript» (без менеджера,
  двойное подключение); «Сетевые запросы в обход CORS страницы» (`@connect`)
- Design: «Настройки и перенос», «Изолированный мир…», «Заголовок userscript», «Ядро и адаптеры…» (выбор режима)
- Контракты: потребляет K1, K3, K4, K5
- Усиление проверок: 4.2 — в GM пишется объект, а не JSON-строка; после переноса второй `getSettings` не читает
  `storage`; при значении в GM `storage` не трогается; `setSettings` сливает патч с текущим, чужие поля целы
- Усиление проверок: 5.1 — `rg -n "declare const GM_" src` — только `index.ts`; `rg -n "GM_" src/core src/types.d.ts`
  пусто
- Усиление проверок: 5.2 — хосты `@connect` в `dist/amo-stickers.user.js` сверены с `ALLOWED_HOSTS` /
  `ALLOWED_DOMAINS` в `core/net.ts`; `@version 0.7.0`; `@grant none` и `localhost` нет
- Усиление проверок: 7.2 — в консоли стенда `[amo-stickers] started (userscript)`; после «Сохранить» ключ
  `amo-stickers:settings` в `localStorage`; запрос GIF виден в Network как `fetch`; без ключа GIPHY — отметить в отчёте

## Волны

1. G1
2. G2
3. G3

## Задачи пользователя (вне групп)

- 7.3, 7.4, 7.5 — живой amo с Tampermonkey / Violentmonkey в браузере пользователя; остаются `[ ]` до его проверки
