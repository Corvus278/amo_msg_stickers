# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `telegram-style-picker`.

## 2026-09-27

### Старт прогона

База прогона: 7b9bb3bdd3474418f842997161e2fb9eae11f9ed. Масштаб средний, 8 групп, 5 волн, режим «дерево» (исполнители по одному).
Гейт: pnpm lint && pnpm test (из CLAUDE.md).
Живые образцы не нужны: UI пикера, проверки — стенд dev/harness.html в headless Chrome (chrome-devtools MCP).
Вне групп: 10.3 (живой amo с авторизацией — делает пользователь), 10.4 (PR/аудит/архив — финал координатора, мерж по воркфлоу).
Решение без заказчика (9.1): ViewHeader/ удаляется вместе с ViewTitle/, если после G4–G7 у него не осталось потребителей; остался — удаляется только ViewTitle/. Альтернатива — оставить мёртвый ViewHeader/; отвергнута ради простоты.

### Замер 1.2 (база 7b9bb3b)

dist/extension/content.js — 314 798 Б (gzip -9: 95 302 Б)
dist/amo-stickers.user.js — 318 075 Б (gzip -9: 96 609 Б)

### G1 · Данные и режим

Решения: недавние по видам через чистые recentKindOf/recentOfKind/recentOverflow в db.ts; listAllStickers → Map<packId, StickerRec[]> (groupStickers), пак без стикеров в Map отсутствует; countStickers — store.count(); K3 в src/core/pickerMode.ts (MODE_KEY, ModeStorage).
Совместимость: useRecent сливает оба вида по ts, useOpenLoad уходит в GIF только при пустых обоих — до G4/G5.
Отступление: RecentKind в db.types.ts (вне файлов группы) — по typescript.md.
Аудит: ok с первого круга, 0 кругов доработки.
Долг: pickerMode.test.ts:17 `|| null` маскирует случай ''; db.ts:301 clearRecent — filter+map двумя проходами (code-style #15); db.ts:163 countStickers без jsdoc; clearRecent/listAllStickers/countStickers/readMode/writeMode пока без потребителей — проверить подключение на аудите G4/G5.

### G2 · Геометрия лент

Решения: K4 — buildStickerLayout {rows, sectionTops, total}, пустой раздел = заголовок + ряд cells с items: [] (место под подсказку), зазор 4 px только между рядами ячеек; visibleRows → [from, to); activeSection → string | null (null — пустая лента, отступление от K4 по задаче 3.2).
K5 — splitColumns(sections, {count, width, gap}) → {tiles, total}, visibleTiles; skeletons — заглушки в конец каждой колонки; MasonryGrid переведён на новую сигнатуру без смены поведения (доли ширины, gap 0) до 7.1.
Решения без заказчика: ACTIVE_SLACK = 1 px — раздел активен, если верх окна не дошёл до его заголовка меньше чем на 1 px (браузер округляет дробный верх при переходе по вкладке); заглушки GIF квадратные — пропорции будущих GIF заранее неизвестны.
Аудит: ok с первого круга.
Долг: HEADER_HEIGHT = 32 объявлен дважды (stickerLayout.ts:12, splitColumns.ts:13); геометрия пока без потребителей — подключение проверить на аудите G5/G6.

### Полномочия от пользователя

2026-09-27: пользователь ушёл спать — прогон довести до конца без него, включая итоговое ревью PR (review-staged, треды, резолв), архив change и мерж (squash, --delete-branch). Вопросы — не ждать ответа, решать по «Эскалации» и сложить в итоговый отчёт.

### 10.3 — живой amo

Пользователь дал тестовый стенд web.dev.amo.tm и два аккаунта: 10.3 выполняет агент после G8, до PR. Креды — в local/dev-amo-creds.md (в .gitignore), в журнал, коммиты и PR не пишутся.

### G3 · Наведение, удержание, анимация

Решения: контроллер hoverPopup с schedule(cb, ms) => cancel; клик по открытому наведением только закрепляет (без onOpen); удержание — createPopupHolds (фокус пишет Picker.tsx, диалог файла — DropZone, импорт — usePickerState, конвертация — useStickerDraft); фаза closing — createPanelPhase, 200 мс по таймеру.
Отступления: HoverPopupOptions.isLeaving и PickerHandle.isClosing — мгновенный возврат во время ухода без мигания; PickerProps.isOpen → phase: PanelPhase (учесть в G4).
Аудит: ok с первого круга, мутации (isHeld в таймере, cancelHide в show) ловятся тестами.
Вопросы аудитора (пользователь делегировал решения, ответ координатора — группа F1): закреплённый попап закрывается наведением на кнопку другого поля (app.ts:163 retarget); снятие удержания при курсоре снаружи не запускает закрытие (hoverPopup.ts:108).
Долг: createPicker.tsx:63 releasePanel снимает «фокус в поле» при закрытии — узкий случай с возвратом за 200 мс; openedBy остаётся 'hover' после закрепления кликом — учесть в G6 (useSearchFocus).
