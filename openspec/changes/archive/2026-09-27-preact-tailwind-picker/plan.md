# План прогона: preact-tailwind-picker

База прогона: `2f379a4`
Ветка: `feature/1-preact-tailwind-picker` — коммит на группу; хук коммита гоняет `pnpm typecheck`, каждая группа зелёная
Гейт: `pnpm lint && pnpm test`
Быстрые проверки: `pnpm typecheck`, `pnpm lint:es`, `pnpm build` (юнит-тестов у UI нет — `pnpm test` пустой прогон)
Долгие слои: стенд — `pnpm build`, `python3 -m http.server 8777 -b 127.0.0.1`, `/dev/harness.html` через chrome-devtools
MCP, светлая и тёмная тема — группы G1 (эталон), G2–G6

## Контракты

- **K1 CSS-модуль** — `src/core/ui/picker.css` импортируется текстом (default-импорт, loader `text`), объявление
  `declare module '*.css'` в `src/types.d.ts`; имя идентификатора не `PICKER_CSS`. Владелец G1; потребитель G2.
- **K2 Фасад** — `createPicker(host, { onSend, onClose }): PickerHandle` в `ui/createPicker.tsx`, типы в
  `ui/createPicker.types.ts`: `element`, `isOpen`, `open()`, `close()`, `setTheme(isDark)`; семантика колбэков — как у
  `PickerCallbacks`. Владелец G2; потребитель `app.ts` (G2).
- **K3 Контекст** — `usePicker()` из `Picker/PickerProvider` отдаёт `env`, `settings`, `packs`, `refreshPacks`,
  `showStatus`, `showError`, `clearStatus`, `send(item)`, `urlOf(id, blob)`, `dropUrl(id)`; вне провайдера — `throw`.
  Владелец G2; потребители G3–G5.
- **K4 Навигация** — `usePickerView()` → `{ view, switchTo(view) }`, тип `View` — в новом `*.types.ts`; `Picker.tsx`
  выбирает представление `switch (view.kind)`. Представления владеют своим скролл-контейнером. G2 кладёт заглушки
  `RecentView`, `GifView`, `PackView({ packId })`, `AddView`, `SettingsView`; G3–G5 меняют только их файлы, не
  `Picker.tsx`. Владелец G2; потребители G3–G5.
- **K5 Примитивы** — `Button` (`variant: 'primary' | 'secondary' | 'danger'`), `TextInput`, `EmptyState`, `StatusBar`.
  Владелец G2; потребители G3–G5.
- **K6 Сетки** — `StickerGrid`/`StickerCell` (отправка, необязательное удаление, занятость) и `MasonryGrid` для GIF.
  Владелец G3; потребители G4 (`MasonryGrid`), G5 (`StickerGrid`).
- **K7 Старый пикер** — `picker.ts`, `styles.ts`, `picker.types.ts`, `icons.ts` до G6 не правятся и новым кодом не
  импортируются (кроме `stickerIcon` в `app.ts`): иначе падает `typecheck` в хуке. Урезает `icons.ts` и удаляет
  остальное G6.
- **K8 Эталон** — снимки старого пикера по всем вкладкам в обеих темах и геометрия панели (`getBoundingClientRect`,
  цвета ключевых узлов) — `local/picker-baseline/`; размеры бандлов на базе — в `journal.md`, запись «Размер бандлов».
  Владелец G1; потребители G2–G6.
- **K9 Цвета** — в `src/core/ui/**/*.tsx` нет hex-литералов и inline-цветов, только токены; ошибка — `red-30`.
  Проверка: `rg -n '#[0-9a-fA-F]{3,8}\b' src/core/ui -g '*.tsx'` пусто. Владелец G1 (токены); потребители G2–G5.
- **K10 Дословный перенос** — тексты и константы (350 мс, 500 мс, 200 px, 2,5 с, лимиты) берутся из `picker.ts`
  на базе без изменений. Потребители G2–G5.

## Группы

### G1 · Сборка, токены и эталон · M · волна 1

- Задачи: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
- Зависит от: —
- Файлы: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `build.mjs`, `tailwind.config.ts`, `src/core/ui/picker.css`,
  `src/types.d.ts`, `journal.md`, `local/picker-baseline/**`
- Требования: — (`skip_specs`); `proposal.md` → «Сборка»
- Design: D1, D2, D3
- Контракты: вводит K1, K8, K9
- Усиление проверок: 1.1 — только проверить `gh issue view 1` и ветку; 1.2 — мерить на `2f379a4` до правок, там же
  снять эталон K8; 2.3 — скрипт: правило класса (`bg-gray-30`, `text-cadetGray-30`, `bg-blue-50`, `text-xsm`,
  `rounded-lgx`, `duration-base` и др.) в собранном CSS совпадает с правилом того же класса в `dev/amo.css`;
  2.4 — временный импорт CSS доказывает класс в обоих бандлах и правку в `watch`, затем откатывается

### G2 · Фасад, провайдер, панель, примитивы · M · волна 2

- Задачи: 3.1, 3.2, 3.3, 3.4, 3.5
- Зависит от: G1
- Файлы: `src/core/ui/createPicker*.{ts,tsx}`, `src/core/ui/Picker/{Picker.tsx,Picker.types.ts}`,
  `Picker/{PickerProvider,usePickerView,useObjectUrls,StatusBar,EmptyState,Button,TextInput}/**`,
  заглушки `Picker/{RecentView,GifView,PackView,AddView,SettingsView}/*`, `src/core/app.ts`
- Требования: `composer-integration`, `sticker-sending` — сценарии открытия, закрытия, темы и отправки
- Design: D4, D5, D6, D9
- Контракты: вводит K2, K3, K4, K5; потребляет K1, K7–K10
- Усиление проверок: 3.2 — `git diff 2f379a4 -- src/core/app.ts` только создание пикера и `host`→`element`;
  3.4 — на стенде rect панели совпадает с K8, смена класса на `<html>` при открытом попапе меняет фон корня,
  Escape закрывает, keydown не доходит до `document`; бандл содержит утилиты из `Picker.tsx`; 3.5 — сверка со снимками K8

### G3 · Вкладки, сетки, недавние · M · волна 3

- Задачи: 4.1, 4.2, 4.3
- Зависит от: G2
- Файлы: `Picker/{Tabs,Tab,TabIcon,StickerGrid,StickerCell,MasonryGrid,RecentView}/**`, `Picker/Picker.tsx`
- Требования: `sticker-library` — недавние и вкладки паков; `sticker-sending` — отправка кликом
- Design: D6, D7, D8
- Контракты: вводит K6; потребляет K3–K5, K7, K9, K10
- Усиление проверок: 4.1 — порядок и `title` вкладок сверить с K8 списком, не глазом; 4.2 — hover через chrome-devtools:
  кнопка удаления невидима без hover и видна с ним; занятая ячейка — `disabled`/нет повторного `onSend`;
  4.3 — после двух отправок первый элемент недавних — последний отправленный

### G4 · GIF и настройки · M · волна 4

- Задачи: 4.4, 4.8
- Зависит от: G3
- Файлы: `Picker/{GifView,useGifFeed,SettingsView}/**` (с `FeedChips`, `SecretField`)
- Требования: `gif-search` — все сценарии; `runtime-hosts` — хранение настроек
- Design: D6, D7, D8
- Контракты: потребляет K3–K6, K9, K10
- Усиление проверок: 4.4 — без ключа подменить `fetch` на стенде ответами с разной задержкой: устаревший ответ не
  попадает в выдачу, скролл до 200 px от конца грузит следующую страницу; 4.8 — reload стенда, значения на месте

### G5 · Паки, импорт, создание · M · волна 4

- Задачи: 4.5, 4.6, 4.7
- Зависит от: G3
- Файлы: `Picker/{PackView,useConfirmPress,AddView,useTelegramImport,useStickerDraft}/**` (с `TelegramImport`,
  `CreateSticker`)
- Требования: `sticker-library`, `telegram-import`, `custom-stickers`, `sticker-conversion` — сценарии UI
- Design: D6, D7, D8, D9
- Контракты: потребляет K3–K6, K9, K10
- Усиление проверок: 4.5 — после удаления стикера его object URL отозван (`fetch(url)` падает); 4.6 — без токена
  подменить `fetch` Bot API на стенде, импорт доходит до N/N и открывает пак; 4.7 — `drop` файла на зону не вызывает
  мок-вложение стенда; повторный выбор файла отзывает прежний URL превью

### G6 · Уборка, документация, версия, гейт · S · волна 5

- Задачи: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
- Зависит от: G4, G5
- Файлы: `src/core/ui/{picker.ts,styles.ts,picker.types.ts,icons.ts}`, `CLAUDE.md`, `package.json`,
  `src/extension/manifest.json`, `build.mjs`, `journal.md`
- Требования: все `openspec/specs/*` — для 6.3
- Design: D6, Migration Plan
- Контракты: снимает K7; потребляет K8
- Усиление проверок: 5.1 — в `icons.ts` только `stickerIcon`; 5.2 — каждый путь из раздела структуры `CLAUDE.md`
  существует; 6.2 — разница к K8 в `journal.md`; 6.3 — отметка по каждому сценарию `openspec/specs/*` в `journal.md`

## Волны

1. G1
2. G2
3. G3 — правит `Picker.tsx` (монтирует `Tabs`), поэтому отдельно
4. G4, G5 — файлы не пересекаются
5. G6
