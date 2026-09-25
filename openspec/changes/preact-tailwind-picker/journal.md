# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `preact-tailwind-picker`.

## 2026-09-25

### Старт прогона

База прогона: 2f379a4 (ветка feature/1-preact-tailwind-picker от master d7731bf; первый коммит — архив add-stickers-extension и артефакты change, по решению пользователя всё в feature-ветку).
Масштаб: средний (27 задач).
Гейт: pnpm lint && pnpm test.
1.1 выполнена координатором: issue #1 (https://github.com/Corvus278/amo_msg_stickers/issues/1), ветка feature/1-preact-tailwind-picker; отметится при закрытии первой группы.
6.4 (живой amo) — делает пользователь, агентам не отдаётся.
6.5 (PR, inline-аудит, резолв) — координатор после прогона; мерж только после ок пользователя.
Живые образцы: не требуются — приёмка на стенде dev/harness.html.

### Решения по плану

1.2: размеры бандлов пишутся в journal.md, в описание PR их переносит координатор на 6.5. Альтернатива — черновик PR сейчас; отвергнута: PR до конца прогона не нужен.
Ключи GIPHY/KLIPY и токен Telegram-бота: пока проверяем на стенде с подменой fetch (как в плане). Вопрос пользователю — на границе волны 3/4.

### Токены для тестов

Координатор создал .env в корне (GIPHY_KEY, KLIPY_KEY, TELEGRAM_BOT_TOKEN) по просьбе пользователя, `.env` добавлен в .gitignore — правка .gitignore уедет в коммит G1. Агенты берут токены из .env для проверки 4.4/4.6 на реальном API; значения не печатать в отчётах, журнале и коммитах.

### Размер бандлов

База `2f379a4` (код `src/`, `build.mjs`, `package.json` совпадает с `master` d7731bf), `pnpm build`, байты; gzip — `gzip -9`, для сравнения.

| Файл | Байт | gzip -9 |
|---|---|---|
| `dist/extension/content.js` | 254 435 | 73 980 |
| `dist/amo-stickers.user.js` | 254 671 | 74 085 |
| `dist/extension/background.js` | 763 | 497 |

### Эталон K8

`local/picker-baseline/` (в .gitignore), снят на базе `2f379a4`, стенд `dev/harness.html`, viewport 1280×800 @2x, чистый профиль Chrome.

- Снимки `{light,dark}-{recent,gif,pack-custom,add,settings}.png` — пустые состояния всех вкладок; `*-{recent,pack-custom}-filled.png` — сетка (4 своих стикера, 2 недавних); `light-add-preview.png` — форма создания с превью и статусом.
- Геометрия и цвета узлов — `light.json`, `dark.json` (по вкладкам), `filled.json` (сетка, ячейки), `light-add-preview.json`.
- Панель: 352×400, x=898 y=362, `border-radius: 10px`; фон светлой `rgb(255,255,255)`, тёмной `rgb(48,48,48)`; текст `rgb(54,59,68)` / `rgb(231,231,231)`; шрифт 13px "Helvetica Neue".
- Вкладки по порядку (`title`): Недавние, GIF, Мои стикеры, Добавить стикеры, Настройки. При пустых недавних открывается GIF.
- Сетка: 4 колонки по 81px, gap 4px, ячейка `border-radius: 8px`, padding 4px; кнопка удаления без hover — `display: none`.
- Не снято: выдача GIF с результатами — `GIPHY_KEY` и `KLIPY_KEY` в `.env` пустые; вкладка импортированного Telegram-пака.

### Ключи API

Пользователь заполнил в .env GIPHY_KEY, KLIPY_KEY, TELEGRAM_BOT_TOKEN. G4 и G5 проверяют выдачу GIF и импорт пака на реальном API; эталон выдачи GIF для сверки G4 снимается там же со старого пикера на базе 2f379a4 (git stash/worktree), значения ключей не печатать.

### G1 · Сборка, токены и эталон

Сделано: 1.1 (issue #1 и ветка, координатор), 1.2 (размеры бандлов и эталон K8 в local/picker-baseline/), 2.1–2.4 (preact/clsx, tailwind 3.4 + postcss, JSX в tsconfig и build.mjs, tailwind.config.ts, плагин CSS в обеих целях и watch).
Решения: конфиг — именованный экспорт tailwindConfig, импорт .ts нативно с ?t= для watch; CSS минифицируется esbuild.transform; picker.css в watchFiles.
Аудит: 1 круг, critical — токены вне видимого в dev/amo.css (31 цвет, 6 spacing, dropShadow.none) против CLAUDE.local.md. Пользователь решил оставить конфиг целиком по D2; находка снята.
Долг: build.mjs:31-35 — ?t=Date.now() копит экземпляры модуля в памяти watch; tailwind.config.ts:14 — content сканирует старые picker.ts/styles.ts до G6; picker.css:10-12 — :host{all:initial} отменяет font/line-height preflight, корень пикера в G2 задаёт font-primary и leading-* сам; design.md:62 называет исходники amo web источником правды.

### G2 · Фасад, провайдер, панель, примитивы

Сделано: 3.1–3.5 — фасад createPicker (K2), app.ts только создание и host→element, PickerProvider/usePicker (K3), usePickerView (K4), панель <dialog> с токенами, тёмной темой и анимацией @starting-style, примитивы K5, заглушки представлений с data-view.
Отступления (приняты аудитом): K3 расширен `status` и `refreshSettings`; новый каталог Picker/useOpenLoad/ (react.md #8); errorMessage продублирован в PickerProvider/errorMessage.ts до удаления picker.ts в G6.
Аудит: 1 круг, ok. Три исполнителя (эстафета после 72 вызовов).
Для G3: Tabs монтировать после <StatusBar /> — статус над вкладками, как в K8. TextInput требует id для <label htmlFor> (jsx-a11y) — нужно G4.
Долг: createPicker.tsx:50-51 — onSend/close в on-пропсы напрямую (react.md #2); usePickerState.ts:77 — значение контекста пересоздаётся на каждый рендер; fontFamily.primary даёт `arial` строчными.

### G3 · Вкладки, сетки, недавние

Сделано: 4.1 (Tabs/Tab/TabIcon, иконки компонентами), 4.2 (StickerGrid, StickerCell с useCellSend, MasonryGrid), 4.3 (RecentView: перечитывание при открытии, удаление, пустое состояние).
Отступления (приняты аудитом): icons.ts не урезан — K7, урезает G6; aria-label="Отправить" у кнопки ячейки — новый текст вне K10 ради доступного имени; K4 — RecentView({ isOpen }), renderView(view, isOpen); шапку «Недавние» RecentView рисует сам.
Аудит: 1 круг, ok. Эстафета после 66 вызовов.
Решение координатора для G4/G5 (идут параллельно): общего компонента шапки не заводить — файл делили бы две группы; шапка представления повторяет классы RecentView.tsx:42-46 (`px-2.5 pb-1.5 pt-2.5`, `min-h-5.5`, `font-semibold truncate`). Представлениям, которым нужно событие открытия (фокус поиска в GifView), — проп `isOpen` по образцу RecentView.
Долг: MasonryCell берёт useCellSend из StickerCell/ (общий хук должен лежать отдельно); Clock/Plus/SettingsIcon лежат в TabIcon/, хотя нужны Tabs; все недавние на удалённые стикеры → пустое состояние вместо пустой сетки (со спекой не расходится).

### G4 · GIF и настройки

Сделано: 4.4 (GifView, useGifFeed, FeedChips, фокус поиска по isOpen), 4.8 (SettingsView, SecretField, ExternalLink, useSettingsDraft). Исполнитель проверил на реальном API против старого пикера (2f379a4): геометрия и цвета в обеих темах, подгрузка, debounce, устаревшие ответы, ошибки ключа, сохранение настроек.
Отступления: Picker.tsx:49 `<GifView isOpen>` вне файлов группы — по решению координатора (запись G3); при догрузке повторы по provider:id отбрасываются.
Аудит: 1 круг, ok; стенд аудитор не прогнал (классификатор прав отклонил http.server над корнем с .env) — стендовые проверки есть у исполнителя.
Вопрос пользователю: запрос и лента GIF сбрасываются при смене вкладки (в старом пикере жили всё время страницы; спека gif-search молчит). Ответ — в группе F1 при необходимости.
Долг: кнопка «Открыть настройки» 19,5 px против 16 px у <a> (строка не растёт); useSettingsDraft.ts:21-23 setDraft в useEffect (react.md #6); SettingsView.tsx:37 void save() без catch (как в старом); SecretField.tsx:33 <p> внутри <label> (перенесено как есть).
