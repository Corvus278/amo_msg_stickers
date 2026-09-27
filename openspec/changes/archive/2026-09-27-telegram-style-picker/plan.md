# План прогона: telegram-style-picker

База прогона: `7b9bb3bdd3474418f842997161e2fb9eae11f9ed`
Гейт: `pnpm lint && pnpm test && pnpm build`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest --project=unit --run tests/<файл>.test.ts`
Долгие слои: стенд `pnpm build` → `python3 -m http.server 8777 -b 127.0.0.1` → `dev/harness.html` (грузит
`dist/amo-stickers.user.js`), headless Chrome + chrome-devtools (запуск — `CLAUDE.local.md`); shadow root закрыт —
DOM пикера читать a11y-снимком `take_snapshot`, не `shadowRoot` — группы G3–G8
Хук коммита: полный `pnpm typecheck` + eslint staged + `vitest --changed` — каждая группа оставляет типы зелёными,
смена сигнатуры правит всех вызывающих в той же группе

## Контракты

- **K1 Недавние по видам** — `RecentKind = 'sticker' | 'gif'` (`local`→`sticker`, `remote`→`gif` из `SendItem.kind`);
  `pushRecent` режет до 40 свой вид, `listRecent(kind)`, `clearRecent(kind)`; ключи `l:…`/`r:…` те же. Владелец G1;
  потребители G5, G6, G7.
- **K2 Библиотека** — `listAllStickers()` → группы по `packId`, стикеры по `createdAt`; `countStickers(): Promise<number>`.
  Владелец G1; потребители G4, G5.
- **K3 Режим** — `PickerMode = 'stickers' | 'gifs'`; `readMode(storage)` → режим | `null` (мусор, исключение),
  `writeMode(storage, mode)` не бросает; ключ `amo-stickers:mode`. Владелец G1; потребитель G4.
- **K4 Геометрия стикеров** — `buildStickerLayout(sections, width)` → `{ rows, sectionTops, total }`, ряд
  `{ kind: 'header' | 'cells', sectionId, top, height, items }`; `visibleRows(...)` → `[from, to)`;
  `activeSection(sectionTops, scrollTop)` → `sectionId`; 32 / 5 / 4 — константы одного модуля. Владелец G2; потр. G5, G7.
- **K5 Геометрия GIF** — позиции `{ column, top, height }` в px в порядке выдачи, заголовки разделов 32 px, элементы
  `kind: 'skeleton'`; окно — фильтр по пересечению с запасом; модуль `MasonryGrid/splitColumns/`. Владелец G2; потр. G6.
- **K6 Открытие и удержание** — фасад `open(openedBy: 'hover' | 'click')`, `isHeld(): boolean`; провайдер отдаёт
  `openedBy` и пишет причины удержания (фокус в поле, диалог файла, импорт, конвертация) в общий объект.
  Владелец G3; потребители G4 (не терять причины при переделке провайдера), G6 (`useSearchFocus`).
- **K7 Состояние вида** — `usePickerView()` → `{ mode, screen, anchor, setMode, openScreen, closeScreen,
  scrollToSection }`, `screen: null | 'add' | 'settings'`, `anchor: { sectionId, seq } | null`; `sectionId` раздела пака —
  `pack.id` (`custom`, `tg:<имя>`), недавних стикеров — `'recent'`. Владелец G4; потребители G5, G6, G7.
- **K8 Слоты режимов** — `Picker.tsx` монтирует оба режима: «Стикеры» — `StickersMode/StickersMode.tsx`, «GIF» —
  `GifView/GifView.tsx`; G4 даёт «Стикерам» временное содержимое без `switchTo`, G5/G6 `Picker.tsx` не правят.
  Владелец G4; потребители G5, G6.

## Группы

### G1 · Данные и режим · M · волна 1

- Задачи: 1.2, 2.1, 2.2, 5.0
- Зависит от: —
- Файлы: `src/core/db.ts` (сигнатура `pushRecent(item)` не меняется), `src/core/pickerMode*.ts`, вызывающие
  `listRecent` — `RecentView/useRecent/**`, `useOpenLoad/**` (только совместимость), `tests/db*.test.ts`, `tests/pickerMode.test.ts`,
  `openspec/changes/telegram-style-picker/journal.md`
- Требования: `sticker-library` → «Недавние»; `sticker-sending` → «Запись в недавние»; `composer-integration` →
  «Навигация попапа» (хранение режима)
- Design: «Недавние по видам», «Данные ленты стикеров», «Состояние: режим, экран, якорь» (хранение режима)
- Контракты: вводит K1, K2, K3
- Усиление проверок: 1.2 — сборка в отдельном worktree на базе, не в рабочем дереве; 2.1, 2.2 — тест зовёт ту же чистую
  функцию, что `db.ts` (проверка `rg` импорта), смешанные записи — литералом в порядке прежней версии

### G2 · Геометрия лент · M · волна 1

- Задачи: 3.1, 3.2, 3.3
- Зависит от: —
- Файлы: `src/core/ui/Picker/stickerLayout/**`, `src/core/ui/Picker/MasonryGrid/splitColumns/**`,
  `MasonryGrid/MasonryGrid.tsx` (только совместимость), `tests/stickerLayout.test.ts`, `tests/splitColumns.test.ts`
- Требования: `sticker-library` → «Паки одной лентой»; `gif-search` → «Тренды и поиск»; `picker-states` → «Заглушки при загрузке»
- Design: «Виртуализация на фиксированной геометрии»
- Контракты: вводит K4, K5
- Усиление проверок: 3.1 — ожидаемые стороны и `total` числами-литералами, не через константы модуля; 3.3 — позиции
  первых N элементов до и после дописанной страницы равны поэлементно; 3.2 — `scrollTop` ровно на границе ряда и `total`

### G3 · Наведение, удержание, анимация · M · волна 1

- Задачи: 3.4, 4.1, 4.2, 4.3
- Зависит от: —
- Файлы: `src/core/hoverPopup*.ts`, `src/core/app.ts`, `src/core/ui/createPicker.tsx`, `src/core/ui/Picker/Picker.tsx`,
  `PickerProvider/**`, `useStickerDraft/**`, `AddView/**` (только причины удержания), `tests/hoverPopup.test.ts`
- Требования: `composer-integration` → «Открытие попапа наведением и кликом»
- Design: «Наведение и закрепление», «Анимация закрытия»
- Контракты: вводит K6
- Усиление проверок: 3.4 — `isHeld` становится `true` после `leave`, до срабатывания таймера; 4.2 — диалог файла на
  стенде имитировать `click` по `input[type=file]` + событием `cancel`; 4.1 — `document.activeElement` в поле сообщения
  после открытия наведением

### G4 · Каркас панели · M · волна 2

- Задачи: 5.1, 5.2, 5.3, 5.4
- Зависит от: G1, G3
- Файлы: `usePickerView/**`, `PickerProvider/**`, `Picker.tsx`, `useOpenLoad/**`, `useStickerDraft/**`, `StatusBar/**`,
  новые `Footer/**`, `Screen/**`, `StickersMode/**`; `AddView/AddView.tsx`, `SettingsView/SettingsView.tsx`,
  `GifView/GifView.tsx`, `PackView/**`, `Tab/**` — только замена `switchTo`; `tests/*` чистой логики, если появится
- Требования: `composer-integration` → «Навигация попапа»; `picker-states` → «Строка статуса», «Управление с клавиатуры»
- Design: «Состояние: режим, экран, якорь», «Статус, заглушки, фокус, прокрутка» (статус)
- Контракты: вводит K7, K8; потребляет K2, K3, K6
- Усиление проверок: 5.1 — на стенде стартовый режим без ключа и со стикерами, режим «GIF» переживает перезагрузку;
  5.2/5.3 — `scrollTop` ленты и значение поиска равны до и после переключения и «Назад»

### G5 · Лента стикеров · M · волна 3

- Задачи: 6.1, 6.2, 6.3, 6.5
- Зависит от: G1, G2, G4
- Файлы: `StickersMode/**`, новые `StickerFeed/**`, `SectionTabs/**`, `PackCover/**`, `usePackImport.ts`,
  `useStickerDraft/**` (якорь), `dev/harness.html` (генератор 20×120)
- Требования: `sticker-library` → «Паки одной лентой», «Недавние»; `telegram-import` → «Прогресс и частичные сбои»,
  «Повторный импорт»; `custom-stickers` → «Сохранение в «Мои стикеры»»; `picker-states` → «Активная вкладка и режим»
- Design: «Виртуализация на фиксированной геометрии», «Данные ленты стикеров», «Статичные обложки паков»
- Контракты: потребляет K1, K2, K4, K7, K8
- Усиление проверок: 6.1 — `rg` импорта `buildStickerLayout`/`visibleRows` в ленте, число рядов в снимке ≤ окна;
  6.2 — `scrollTop` ленты равен `sectionTops` пака; 6.5 — импорт при закрытом экране «Добавить» ленту не двигает

### G6 · Режим GIF · M · волна 3

- Задачи: 7.1, 7.2, 7.3, 4.4
- Зависит от: G1, G2, G3, G4
- Файлы: `GifView/**`, `MasonryGrid/**`, `useGifFeed/**`
- Требования: `gif-search` → «Доступные источники», «Тренды и поиск»; `picker-states` → «Заглушки при загрузке»;
  `composer-integration` → «Открытие попапа наведением и кликом» (фокус поиска)
- Design: «Виртуализация на фиксированной геометрии», «Наведение и закрепление» (`openedBy`)
- Контракты: потребляет K1, K5, K6, K7, K8
- Усиление проверок: 7.1 — порядок ячеек в снимке равен порядку выдачи; 7.3 — медленная загрузка через троттлинг сети
  devtools, не правкой стенда; 4.4 — после открытия наведением `activeElement` — поле сообщения

### G7 · Меню и удаление · M · волна 4

- Задачи: 8.1, 6.4, 8.2
- Зависит от: G5, G6
- Файлы: новые `Menu/**`, `SectionHeader/**`; `StickerFeed/**`, `StickerCell/**`, `MasonryGrid/MasonryCell/**`,
  `GifView/**` (недавние GIF), `useConfirmPress/**`
- Требования: `sticker-library` → «Удаление», «Недавние»; `picker-states` → «Иерархия заголовков», «Управление с клавиатуры»
- Design: «Меню: контекстное и раздела»
- Контракты: потребляет K1, K4, K7
- Усиление проверок: 8.2 — после удаления стикера `scrollTop` ленты не изменился; 8.1 — Escape в меню не закрывает попап

### G8 · Состояния, уборка, версия · M · волна 5

- Задачи: 8.3, 9.1, 9.2, 9.3, 10.1, 10.2
- Зависит от: G7
- Файлы: `src/core/ui/Picker/**` (классы состояний, удаление старых каталогов), `CLAUDE.md`, `package.json`,
  `src/extension/manifest.json`, `build.mjs`
- Требования: `picker-states` → «Прогресс отправки на ячейке», «Наведение и фокус», «Активная вкладка и режим»,
  «Полоса прокрутки»; все дельты — 10.2
- Design: «Статус, заглушки, фокус, прокрутка»
- Контракты: —
- Усиление проверок: 9.1 — `rg -n "Tabs/|Tab/|TabIcon|RecentView|PackView|StickerGrid|ViewTitle|switchTo" src` пусто;
  10.1 — размеры бандлов против цифр 1.2 из `journal.md`

## Волны

1. G1, G2, G3 — файлы не пересекаются: `app.ts` и провайдер — только G3
2. G4
3. G5, G6 — общие только `usePickerView`/провайдер на чтение; `dev/harness.html` — только G5
4. G7
5. G8
