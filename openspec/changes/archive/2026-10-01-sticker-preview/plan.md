# План прогона: sticker-preview

База прогона: `5c9e7f7cf8ed860178bc105dd3dc08eca9a03db8`
Гейт: `pnpm lint && pnpm test` (перед коммитом группы хук гоняет lint-staged, `pnpm typecheck`, `vitest --changed`)
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest --project=unit --run tests/<файл>.test.ts`
Долгие слои: нет; стенд `dev/harness.html` и живой amo агент не запускает (см. отчёт)

## Контракты

- **K1 Ключи и имена** — `MessageKey`: `menu.preview`, `preview.close`, `cell.sticker.preview{,Caption,Emoji}`, `cell.gif.preview{,Title}`; `CellNames.preview`. Владелец G1; потребители G3, G4.
- **K2 Жест** — `HOLD_DELAY_MS`=300, `HOLD_SLOP_PX`=6, `createPressGesture` (чистая, с `dispose`), `usePressPreview({ onHold, isDisabled })` → обработчики pointer-событий. Владелец G2; потребитель G4.
- **K3 API предпросмотра** — `usePreview()` → `{ openHold, openPinned, close }`, аргументы `(target, source: HTMLElement)`; `target` = `{ url, previewUrl?, name }`. Владелец G3; потребитель G4.
- **K4 Отпускание hold** — только провайдер: `pointerup`/`pointercancel` на `window` закрывают, один `click` в capture гасится, слушатель снят по `setTimeout(0)`. Ячейки флагов «держали» не хранят. Владелец G3; G4 не дублирует.
- **K5 Причина `preview`** — в `HoldReason` и `PANEL_REASONS`, пишется только `setHold('preview', target !== null)` из провайдера. Владелец G3.
- **K6 Подключение** — `PreviewProvider` и оверлей смонтированы в `Picker.tsx` (перед `StatusBar`); `usePreview` и `usePressPreview` реально зовут `StickerCell` и `MasonryCell`. Вводят G3, G4; проверка: `rg`.
- **K7 Версия** — `0.16.0` одновременно в `package.json`, `src/extension/manifest.json`, `@version` в `build.mjs`. Владелец G5.

## Группы

### G1 · Словарь и имена · S · волна 1

- Задачи: 1.1, 1.2
- Зависит от: —
- Файлы: `src/core/i18n/messages.{ru,en}.ts`, `src/core/ui/Picker/cellName/**`, `tests/cellName.test.ts`
- Требования: `picker-states` → «Увеличенный предпросмотр» (имена диалога, английский интерфейс)
- Design: «Имя для скринридера»
- Контракты: вводит K1
- Усиление проверок: 1.2 — тест сверяет точные фразы («Предпросмотр стикера «привет»», «Preview of sticker “привет”»).

### G2 · Жест удержания · M · волна 1

- Задачи: 2.1, 2.2
- Зависит от: —
- Файлы: `src/core/ui/Picker/pressGesture/**`, `src/core/ui/Picker/usePressPreview/**`, `tests/pressGesture.test.ts`
- Требования: `picker-states` → «Увеличенный предпросмотр» (300 мс, 6 px, кнопки, касание)
- Design: «Удержание: таймер в хуке ячейки»
- Контракты: вводит K2
- Усиление проверок: 2.2 — логику таймера держать в `createPressGesture` с `dispose`, тест: `dispose` снимает таймер.

### G3 · Контекст и оверлей · M · волна 2

- Задачи: 3.1, 3.2, 3.3
- Зависит от: G1
- Файлы: `src/core/hoverPopup{,Holds}.ts`, `hoverPopup.types.ts`, `src/core/ui/Picker/Preview/**`, `Picker.tsx`, `tests/hoverPopup*.test.ts`, `tests/preview*.test.ts`
- Требования: `picker-states` → «Увеличенный предпросмотр»; `gif-search` → «Качество превью и отправки»
- Design: «Состояние — контекст панели», «Закреплённый предпросмотр», «Картинка», «Движение», «Удержание попапа», «Закрытие при смене контекста»
- Контракты: вводит K3, K4, K5; вводит K6 (провайдер, оверлей); потребляет K1
- Усиление проверок: 3.2 — логика hold-отпускания и гашения клика в модуле без DOM, тест на `countingEventTarget`: pointerup закрывает, гасится ровно один click, без click слушатель снят по `setTimeout(0)`, source не в документе. 3.1 — тест `releasePanel` снимает `preview`. 3.3 — атрибуты по режиму (`role`/`aria-hidden`/`aria-label`) и решение о возврате фокуса — чистой функцией с тестом.

### G4 · Ячейки и меню · M · волна 3

- Задачи: 4.1, 4.2, 4.3
- Зависит от: G1, G2, G3
- Файлы: `src/core/ui/Picker/Menu/CellMenu/**`, `StickerCell/**`, `StickerFeed/FeedRow/**`, `MasonryGrid/MasonryCell/**`, `tests/cellMenu*.test.ts`
- Требования: `picker-states` → «Увеличенный предпросмотр» (меню, GIF из поиска, недавние, отправка на занятой ячейке)
- Design: «Закреплённый предпросмотр из меню», «`select-none`», «Риски» (`draggable`, `pointer-events-none`)
- Контракты: потребляет K1–K4; замыкает K6
- Усиление проверок: 4.1/4.3 — состав пунктов меню чистой функцией + тест (найденная GIF: [preview]; недавняя GIF и стикер: [preview, remove]). Подключение — `rg usePressPreview|usePreview` в обеих ячейках.

### G5 · Доки, версия, гейт · S · волна 4

- Задачи: 5.1, 5.2, 5.3, 6.1
- Зависит от: G1, G3, G4
- Файлы: `docs/content/{,en/}faq.md`, `CLAUDE.md`, `package.json`, `src/extension/manifest.json`, `build.mjs`
- Требования: `picker-states` → «Увеличенный предпросмотр» (названия пунктов — строки словаря)
- Design: —
- Контракты: вводит K7
- Усиление проверок: 6.1 — после `pnpm build` `rg -c "0.16.0"` в `dist/amo-stickers.user.js` и `dist/extension/manifest.json`.

## Волны

1. G1, G2 — файлы не пересекаются
2. G3
3. G4
4. G5
