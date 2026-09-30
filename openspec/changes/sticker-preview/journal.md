# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `sticker-preview`.

## 2026-09-30

### Старт прогона

База прогона: 5c9e7f7cf8ed860178bc105dd3dc08eca9a03db8. Масштаб средний, 5 групп (G1–G5), режим «дерево».
Гейт — из plan.md. Живые образцы: не требуются (UI-фича, данных пользователя нет).
Вне групп, агент выполнить не может (браузер / живой amo с ключом GIF): 3.4, 4.4, 6.2 и проверочные части 4.1–4.3. Чекбоксы остаются [ ].

### G1 · Словарь и имена

G1 ok, аудит с первого круга, critical нет, долг нет.
Ключи K1 (7 шт.) парой в RU/EN, CellNames.preview заполнен в stickerCellName и gifCellName.
Отступление: правлен tests/feedSections.test.ts (вне списка) — CellNames.preview стал обязательным, toEqual упал; добавлен preview в ожидаемые name.
Вместе с G1 в коммит попали артефакты change (proposal, design, specs, plan, tasks, journal).

### G2 · Жест удержания

G2 ok, аудит с первого круга, critical нет.
createPressGesture (HOLD_DELAY_MS=300, HOLD_SLOP_PX=6, dispose) + usePressPreview({ onHold, isDisabled }); onHold получает source (кнопку ячейки) под K3 openHold(target, source). Порог сдвига — Math.hypot строго > 6.
Долг: при isDisabled нажатие выходит до gesture.start, незавершённый жест не отменяется (не проявится); имена onPointerUp/Cancel ссылаются на onPointerLeave; хук (useEffect dispose, latestRef) тестом не покрыт — окружение node; в тестах нет границы ровно 6 px.

### G3 · Контекст и оверлей

G3 ok, аудит с первого круга, critical нет.
Причина preview в HoldReason/PANEL_REASONS; PreviewProvider (openHold/openPinned/close + preview в usePreview) смонтирован в Picker.tsx уже в 3.2 (иначе мёртвый код), оверлей в 3.3 перед StatusBar. Отпускание — чистый watchHoldRelease (стоп-клик через stopImmediatePropagation + preventDefault). ARIA и возврат фокуса — чистые функции previewA11y с тестами.
Долг: (1) слушатель отпускания вешается в useEffect после рендера — pointerup в пределах кадра после 300 мс проскочит (лечится useLayoutEffect / подпиской в openHold) — проверить на стенде 3.4/4.2; (2) правила закрытия в эффектах провайдера без юнит-теста (окружение node); (3) focusout с relatedTarget=null закрывает pinned, порядок возврата фокуса после меню vs фокус на «Закрыть» — проверить в 4.1; (4) CLOSE_BUTTON_CLASS дублирует кнопку «Назад» в Screen.tsx; (5) пустой case 'escape' в previewA11y.
Вне группы остаётся 3.4 (стенд).

### G4 · Ячейки и меню

G4 ok, аудит с первого круга, critical нет. Закрыты только кодовые части 4.1–4.3.
CellMenu: onPreview обязательный, kind необязателен, состав пунктов — чистая cellMenuItems(kind) с тестом. StickerCell и MasonryCell: usePressPreview + usePreview (K6 проверен rg), select-none, isDisabled по занятости. Меню у всех GIF; у найденной один пункт, у недавней два. GIF: url = версия для отправки, previewUrl = превью ленты.
Долг G3 №1 закрыт: слушатели watchHoldRelease взводятся синхронно в openHold, снимаются в close/openPinned/размонтировании.
Долг: управление unwatchReleaseRef в провайдере без юнит-теста (можно вынести в чистый держатель слушателя); в CellMenu ветка `!kind || !onRemove` дублирует cellMenuItems; подключение onPreview/kind в ячейках наблюдается только стендом.
Не проверено (нужен стенд / живой amo с ключом GIF, чекбоксы 3.4, 4.4, 6.2 остаются [ ]): меню стикера/недавнего/GIF, порядок фокуса меню → «Закрыть предпросмотр», удержание 300 мс, отпускание не отправляет, быстрый клик отправляет, отпускание вне панели, drag/выделение, английский интерфейс, прокрутка при удержании.

### G5 · Доки, версия, гейт

G5 ok, аудит: 1 круг доработки (2 critical: 200 мс vs duration-base=175 мс в CLAUDE.md; typograf заголовков FAQ), второй круг ok, долг закрыт в том же круге.
FAQ ru/en «Как рассмотреть стикер или GIF крупно» (удержание, «Предпросмотр» в меню, Escape/клик/«Закрыть предпросмотр», касание не открывает удержание). CLAUDE.md: Preview/, pressGesture/, usePressPreview/, причина удержания preview, меню у всех GIF. Версия 0.16.0 в трёх местах, check-version ok.
6.1: pnpm lint, pnpm test (984 теста), pnpm build, docs:build — зелёные; 0.16.0 в dist.

### Решение пользователя: Ctrl+клик

Итоговый аудит (question): Ctrl+клик на macOS = pointerdown button 0 + contextmenu; удержание >300 мс открывало hold-предпросмотр поверх меню ячейки.
Решено пользователем: Ctrl+клик удержанием не считать (жест не стартует при ctrlKey на pointerdown, остаётся только меню). Доработка — группа F1 (код + тест). Правка спеки picker-states — предложение для /opsx:update.

### F1

F1 ok: доработка по question итогового аудита (Ctrl+клик на macOS открывал hold-предпросмотр поверх меню). Решение пользователя: Ctrl+клик удержанием не считать.
PressStart.isCtrlPressed (обязательное поле), start без таймера при нём, хук передаёт event.ctrlKey; тесты на фейковых таймерах. CLAUDE.md дополнен. Аудит: 1 круг доработки (critical — строка CLAUDE.md >120 знаков), второй ok.
Долг: Ctrl+левый клик на Windows/Linux тоже не удержание — не отражено в FAQ ru/en и в спеке picker-states (спека — для /opsx:update).
