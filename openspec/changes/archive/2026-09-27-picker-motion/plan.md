# План прогона: picker-motion

База прогона: `d99ee6f7cb23c2e397b50a3099b005614d064c5c`
Гейт: `pnpm lint && pnpm test && pnpm build`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest run --project=unit tests/<файл>.test.ts`
Долгие слои: `pnpm build` + стенд `dev/harness.html` (грузит `dist/amo-stickers.user.js`; `python3 -m http.server 8777
-b 127.0.0.1`, chrome-devtools, светлая и тёмная тема) — группы G3, G4, G5, G6, G7
Хук коммита: lint-staged + полный `pnpm typecheck` + `vitest --changed` — каждая группа оставляет типы зелёными.
Вне групп (решение координатора): 8.3 — живой amo; 8.4 — PR, аудит, резолв, архив, мерж.

## Контракты

- **K1 scrollMotion** — `scrollMotion(): ScrollBehavior` в `Picker/scrollMotion/`, `'auto'` при `reduce`, иначе
  `'smooth'`, читает `matchMedia` на каждый вызов. Владелец G2; потребители G4, G5.
- **K2 sectionScrollPlan** — `sectionScrollPlan({ from, to, viewport, maxScroll })` → `{ jumpTo: number | null,
  target }`, прыжок строго при `|target - from| > viewport`. Владелец G2; потребитель G4.
- **K3 createScrollLock** — `createScrollLock({ quietMs, schedule, onChange })` → `{ lock, scroll, interrupt, current,
  dispose }`; `schedule` — тип `ScheduleTimer` из `core/hoverPopup.ts`, `quietMs` = 150. Владелец G2; потребитель G4.
- **K4 centerScrollLeft** — `centerScrollLeft(tab, strip)` без DOM: вкладка `{ left, width }` (`offsetLeft`,
  `offsetWidth`), полоса `{ width, scrollWidth }`; итог в `[0, scrollWidth - width]`. Владелец G2; потребитель G5.
- **K5 плитка в раскладке** — `StickerSection.hasCreateTile: boolean` (обязательное), слотов `items.length + 1`;
  ряд с плиткой — `hasCreateTile: true` у последнего ряда раздела; `true` только у `custom` в `feedSections`.
  Владелец G3; потребители G4 (якорь, активный раздел по `sectionTops`).
- **K6 PlusIcon** — общий `Picker/PlusIcon/PlusIcon.tsx`, `SectionTabs/PlusIcon/` удалён. Владелец G3; потребитель G5.
- **K7 якорь с движением** — `SectionAnchor.motion: 'smooth' | 'instant'`, `scrollToSection(sectionId, motion)` —
  второй аргумент обязателен; `SectionTabs` → `'smooth'`, `useStickerDraft`, `finishImport` → `'instant'`.
  Владелец G4; потребитель G5 (вызов в `SectionTabs.tsx` сохраняет `'smooth'`).
- **K8 классы движения** — переход только под `motion-safe:`, стартовое состояние — `[@starting-style]:` без варианта,
  длительности — только `duration-base` / `duration-lg`, цвета — токены. Владелец G6; потребители G3, G5.

## Группы

### G1 · Issue и ветка · S · волна 1

- Задачи: 1.1
- Зависит от: —
- Файлы: — (`gh issue create`, `gh issue edit --add-assignee @me`, ветка от свежего `master`); остальные коммиты
  прогона — уже в этой ветке

### G2 · Чистая логика прокрутки · M · волна 2

- Задачи: 2.1, 2.2, 2.3, 2.4
- Зависит от: G1
- Файлы: `SectionTabs/centerScrollLeft/**`, `StickersMode/sectionScrollPlan/**`, `StickersMode/scrollLock/**`,
  `Picker/scrollMotion/**`, `tests/{centerScrollLeft,sectionScrollPlan,scrollLock,scrollMotion}.test.ts`
- Требования: `sticker-library` → «Паки одной лентой»; `picker-states` → «Анимации переходов»
- Design: «План плавной прокрутки», «Удержание выбранной вкладки», «Центрирование полосы вкладок», «Чтение
  `prefers-reduced-motion` в JS»
- Контракты: вводит K1, K2, K3, K4
- Отступление: удаление `revealScrollLeft/` и `tests/revealScrollLeft.test.ts` из 2.1 — в G5 (его импортирует
  `useRevealTab`, типы сломались бы)
- Усиление проверок: 2.1 — эталоны посчитаны вручную, не формулой; вкладка не в середине контента. 2.2 — граница
  `|target - from| === viewport` без прыжка, `to < 0`, `maxScroll < 0`. 2.3 — после `dispose` таймер не срабатывает и
  `onChange` не зовётся; `scroll()` / `interrupt()` без `lock` — без `onChange`. 2.4 — подмена `matchMedia` между двумя
  вызовами меняет результат (чтение на момент вызова)

### G3 · Плитка «Создать стикер» · M · волна 2

- Задачи: 2.5, 4.2
- Зависит от: G1
- Файлы: `stickerLayout/**`, `StickersMode/feedSections/**`, `StickerFeed/**`, `Picker/PlusIcon/**`,
  `SectionTabs/PlusIcon/**` (удаление), `SectionTabs/SectionTabs.tsx` (только импорт `PlusIcon`),
  `tests/{stickerLayout,feedSections,anchorTop,feedActiveSection}.test.ts` (фикстуры)
- Требования: `sticker-library` → «Паки одной лентой» (сценарии плитки); `custom-stickers` → «Сохранение в «Мои
  стикеры»» → «Пустой пак»
- Design: «Плитка «Создать стикер» в конце «Моих стикеров»»
- Контракты: вводит K5, K6; соблюдает K8
- Усиление проверок: 2.5 — 10 стикеров при 5 колонках → третий ряд из плитки, `sectionTops` следующего раздела
  сдвинут на ряд; пустой пак без плитки — один ряд «Пак пуст». 4.2 — на стенде правый клик по плитке: `role=menu` в
  shadow root не появился; у плитки нет `aria-selected` и она не в `items` (`removalFocus` не видит её)

### G4 · Плавный переход к разделу · M · волна 3

- Задачи: 3.1, 3.2, 3.3
- Зависит от: G2, G3
- Файлы: `usePickerView/**`, `StickersMode/{useFeedWindow,anchorTop}/**`, `StickersMode/StickersMode.tsx`,
  `useStickerDraft/**`, `PickerProvider/**`, `SectionTabs/SectionTabs.tsx` (вызов `scrollToSection`),
  `tests/{anchorTop,finishImport}.test.ts`
- Требования: `sticker-library` → «Паки одной лентой» (переход по вкладке, далёкий пак, прерывание, подсветка)
- Design: «Способ прокрутки — в якоре», «План плавной прокрутки», «Удержание выбранной вкладки»
- Контракты: вводит K7; потребляет K1, K2, K3, K5
- Усиление проверок: 3.1 — `finishImport.test.ts` проверяет `'instant'` вторым аргументом. 3.2 — стенд засевается
  20 паками по 120 стикеров через IndexedDB (`evaluate_script`); во время доезда несколько замеров числа рядов в DOM
  (≤ окно) и `aria-selected` — всё время на нажатой вкладке; клик по вкладке уже видимого раздела не держит подсветку.
  3.3 — сразу после сохранения `scrollTop` ленты равен цели в первом же кадре

### G5 · Полоса вкладок · M · волна 4

- Задачи: 4.1, 4.3, 4.4, 5.5
- Зависит от: G2, G3, G4
- Файлы: `SectionTabs/**` (кроме `centerScrollLeft/`), удаление `SectionTabs/{revealScrollLeft,useRevealTab}/` и
  `tests/revealScrollLeft.test.ts`, `Footer/**`
- Требования: `sticker-library` → «Паки одной лентой» (центр, «+» при длинной полосе); `picker-states` → «Активная
  вкладка и режим», «Наведение и фокус» → «Навигация с клавиатуры»
- Design: «Центрирование полосы вкладок», «Индикатор — один элемент на полосу», «Кнопка «+» вне полосы»
- Контракты: потребляет K1, K4, K6, K7; соблюдает K8
- Усиление проверок: 4.1 — `tablist.querySelector('[aria-label="Добавить стикеры"]')` пусто; порядок Tab снят
  нажатиями. 4.3 — `scrollY` страницы стенда не меняется при центрировании; при повторном открытии `scrollLeft` полосы
  в первом кадре уже равен центру. 4.4 — промежуточный `transform` индикатора посреди перехода (переезд, а не скачок);
  при открытии попапа первый кадр — на месте вкладки

### G6 · Появление и наведение · M · волна 2

- Задачи: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2
- Зависит от: G1
- Файлы: `ModePanel/**`, `Screen/**`, `Picker.tsx`, `Menu/Menu.tsx`, `Menu/Menu.types.ts`, `StatusBar/**`,
  `Button/**`, `GifView/FeedChips/FeedChip/**`, `GifView/GifView.tsx`, `AddView/CreateSticker/DropZone/**`,
  `AddView/TelegramImport/**`, `useTelegramImport/**`, `picker.css`, `tailwind.config.ts` (если понадобится)
- Требования: `picker-states` → «Анимации переходов», «Наведение и фокус»; `telegram-import` → «Разбор ссылки на пак»
- Design: «Появление — `@starting-style` под `motion-safe:`», «Наведение кнопок и недоступный «Импорт»»
- Контракты: вводит K8
- Усиление проверок: 5.1–5.4 — `getComputedStyle(...).transitionDuration` ненулевой без эмуляции и нулевой под
  `prefers-reduced-motion: reduce` (CDP `Emulation.setEmulatedMedia`). 6.1 — в собранном CSS есть правила
  `:enabled:hover`; у недоступной кнопки под `forcePseudoState(hover)` computed-стиль не меняется. 6.2 — `disabled` у
  «Импорт» при `''` и `'   '`, снят после символа

### G7 · Документация, версия, гейт · S · волна 5

- Задачи: 5.6, 7.1, 7.2, 8.1, 8.2
- Зависит от: G2, G3, G4, G5, G6
- Файлы: `CLAUDE.md`, `package.json`, `src/extension/manifest.json`, `build.mjs` (`@version`)
- Требования: все сценарии дельт `sticker-library`, `custom-stickers`, `picker-states`, `telegram-import`
- Контракты: сверяет K1–K8 по коду
- Усиление проверок: 7.2 — `node scripts/check-version.mjs --base origin/master`; 5.6 — те же замеры
  `transitionDuration` и мгновенный `scrollTop` при эмуляции `reduce`

## Волны

1. G1
2. G2, G3, G6 — файлы не пересекаются (G3 в `SectionTabs/` правит только импорт и `PlusIcon/`)
3. G4
4. G5 — после G4: оба правят `SectionTabs.tsx`
5. G7
