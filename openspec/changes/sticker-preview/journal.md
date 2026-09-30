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
