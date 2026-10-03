# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `user-docs`.

## 2026-09-27

### Старт прогона

База прогона: 3ca6b8f1697e6bc793f0ce607720a38d010147be. Масштаб: средний, режим «дерево», группы последовательно.
Гейт: pnpm lint && pnpm test && pnpm build && pnpm docs:build (docs:build — с G1).
Вне групп: 6.3 — Pages включает автор. Проверки только у автора/после push: 2.2 и 6.1 (статусы и артефакт PR), 6.2 (деплой после мержа), 4.2 (чистый профиль Chrome), 4.4 (импорт пака реальным ботом), 4.5 (ключ и лимит KLIPY в Partner Panel).
Живых образцов нет: change — дока и подсказки, данных пользователя спека не трогает.

### G1 · Каркас сайта доки

vitepress 1.6.4 + vitepress-plugin-tabs 0.9.1 (точные версии), запасной вариант не нужен.
Отступление: overrides '@types/markdown-it': 14.1.2 в docs/pnpm-workspace.yaml — типы VitePress 1.x и плагина расходятся (isPunctCharCode), без override md.use не проходит типы; as unknown as запрещён.
export default в config.mts и theme/index.ts — требование VitePress, объяснено jsdoc.
Хук .claude/hooks/lint.sh гоняет tsc только по корневому tsconfig; docs/tsconfig проверяет pnpm typecheck.
docs:dev в браузере не кликали: поиск, тема, навигация проверены по сборке.
Аудит: ok с первого круга. Долг: override не описан в design.

### G2 · Автообновление userscript и CI

@updateURL/@downloadURL — только при !isWatch (как devMatches), адрес в LATEST_USERSCRIPT_URL; тест проверяет ветку и адрес по build.mjs.
release.yml: убран неиспользуемый VERSION из env gh release create.
pages.yml: contents: read на уровне workflow, pages/id-token: write только у deploy; deploy needs build; upload-pages-artifact@v5, deploy-pages@v5; configure-pages не нужен (base жёсткий).
Аудит: ok с первого круга. Долг: paths pages.yml без корневого package.json (скрипт docs:build) — так в design; старое имя архива в README/CLAUDE.md — задачи 5.1/7.2.
Статусы PR, артефакт и деплой — проверка после push/мержа.

## 2026-09-28

### G4 · Тексты доки: главная и установка

Внешние вкладки — ::::tabs: с :::tabs вложенный ::: warning закрывал вкладки.
_parts/userscript.md — общие шаги любого менеджера; поведение Tampermonkey помечено как его; шаг «Разрешить пользовательские скрипты» — только в Chromium.
Главная — layout: home; ссылка на install/ продублирована в тексте (frontmatter VitePress не проверяет на битость).
Не сверено по источникам (проверка автора): кнопка «Загрузить распакованное» в Edge, переключатель в Opera, подписи Safari «Настройки → Расширения», автообновление в Userscripts (не обещаем).
Аудит: ok с первого круга. Долг для G6: chromium.md:8 — прямо назвать Chrome Web Store рекомендуемым (спека); _parts/userscript.md:1-5 — формулировка двусмысленна для Safari (ссылка там открывается текстом).

### Ответы автора (волна 2)

K6 (путь к ссылке на пак): G3 берёт фразу из telegram.md шаг 4 как есть; автор сверит в живых клиентах Telegram до мержа и поправит при расхождении.
Лимит KLIPY: оставить 100 запросов в час (klipy.com/api-overview) с пометкой «актуальная цифра — в Partner Panel».

### G5 · Тексты доки: настройка, обновление, FAQ, политика

K6 — фраза пути к ссылке на пак в telegram.md шаг 4 (якорь #pack-link); автор сверит до мержа. Лимит KLIPY 100/ч по klipy.com/api-overview, с пометкой Partner Panel (ответ автора).
Явные якоря {#pack-link} {#limits} {#archive}: авто-слаг VitePress для кириллицы хрупкий. Переустановка userscript — без номера версии. В privacy добавлен GitHub (скачивание, проверка обновлений).
Не сверено (вопросы автору в финале): панель GIPHY («Create an API Key», API/SDK); Tampermonkey — обновление скрипта без @namespace поверх старого с сохранением ключей, русское название «Check for userscript updates», проверка раз в сутки.
Аудит: ok с первого круга. Долг для G6 (фактические неточности): telegram.md:77 — признак ошибки «со словом Telegram» не совпадает с кодом (фактически HTTP 401/400 с Unauthorized/STICKERSET_INVALID, net.ts:98); telegram.md:65 — пример прогресса должен быть «Имя пака»: 12/40 (status.importProgress); privacy.md:22 — «настройки вместе с расширением или скриптом» неверно для userscript без менеджера (localStorage amo).

### G3 · Подсказки в интерфейсе

userDocs.ts: USER_DOCS_URL, USER_DOCS_PAGE {gifKeys, telegram}, userDocsUrl(page); тест — docs/<страница>.md существует (import ?raw) и база = base из config.mts.
Ссылки на доку — подстановка {docs} (settings.docs, gifs.docs, add.telegram.docs; en — «(in Russian)»), без якорей.
K6: ru-фраза add.telegram.hint дословно из telegram.md:49; en «Copy Link» — предположение, автор сверит.
Отступление: правлены tests/translate.test.ts и tests/renderMessage.test.ts (вне файлов G3) — сверяют реальные строки словаря.
Стенд headless Chrome: ru/en, обе темы, порядок полей, 7 ссылок target=_blank. Эстафета нарушена: 3.5 отдан тому же исполнителю после 71 вызова (сообщение ушло до уведомления).
Аудит: ok с первого круга. Долг: *_DOCS_URL и jsdoc повторены в трёх компонентах — можно отдавать адреса из userDocs.ts; цикл типов userDocs.types.ts ↔ userDocs.ts.

### G6 · Полировка текстов, README, версия, финал

typograf портил Markdown (маркеры, ссылки, ::::, код) — взят только «пробел → U+00A0», разметка возвращена. Тесты translate/renderMessage правлены под NBSP (вне файлов группы).
Долг G4/G5 закрыт полностью (аудит подтвердил).
Скрины для PR (17): home/picker (index); install/extensions-load-unpacked, install/allow-user-scripts (chromium); install/tampermonkey-install, install/sticker-button (_parts/userscript → chromium, firefox, safari); install/safari-userscripts (safari); update/extensions-reload, update/tampermonkey-check-updates (update); setup/klipy-api-keys, setup/gif-mode-klipy, setup/giphy-dashboard (gif-keys); setup/botfather-newbot, setup/botfather-token, setup/settings-token, setup/telegram-pack-link, setup/telegram-import (telegram); README: docs/img/readme/demo.gif. Без скринов: faq, privacy, install/index, desktop.
7.3: гейт ok, стенд ru/en × светлая/тёмная — 8 ссылок, target=_blank. 5.1 «ссылки на GitHub открываются» — после Pages (6.3) и первого релиза.
Аудит: ok с первого круга. Долг: CLAUDE.md:602 длинная строка; старое имя архива в openspec/specs/ci-cd/spec.md:72,82 — уйдёт при архиве.

### Ответы автора (финал)

Tampermonkey (обновление без @namespace, русское «Check for userscript updates», раз в сутки) — автор сверит до мержа.
Пункты браузеров и сервисов (Edge, Opera, «Подробнее», Safari, панель GIPHY, Partner Panel KLIPY, en «Copy Link» в Telegram) — автор сверит до мержа.
pages.yml: добавить корневой package.json в paths — группа F1 (pages.yml + design.md + CLAUDE.md, если там перечислены paths). Критерий: правка только package.json в master запускает pages.yml.
6.3 — автор включит Pages до мержа; задача остаётся [ ].

### F1

Решение автора: корневой package.json в paths pages.yml ('package.json' без префикса — только корень; docs/package.json покрыт docs/**). design.md и CLAUDE.md синхронизированы.
Аудит: ok с первого круга. Долг: design.md:172 — сбитый перенос строки. Запуск по правке package.json — видно после мержа.

### Pages

Автор включил Pages; gh api repos/.../pages: build_type=workflow, html_url https://corvus278.github.io/amo_msg_stickers/.

### Итог

Гейт: pnpm lint && pnpm test && pnpm build && pnpm docs:build — ok. openspec validate --strict — ok.
Покрытие (итоговый аудит): 16 требований, 36 сценариев, без проверки 0. Задачи 25/25.
Группы G1–G6, F1 — ok с первого круга, доработок по critical нет.
До мержа у автора: сверка Tampermonkey (обновление без @namespace, «Check for userscript updates», раз в сутки); пункты Edge/Opera/«Подробнее»/Safari/GIPHY/KLIPY; путь к ссылке на пак в Telegram (ru и en «Copy Link»); установка в чистом профиле Chrome.
После push/мержа: 6 статусов PR и артефакт amo-stickers.zip; деплой Pages; ссылки README на latest.
Скрины для описания PR — в записи G6.
