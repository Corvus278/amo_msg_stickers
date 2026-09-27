# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `picker-motion`.

## 2026-09-27

### Старт прогона

База прогона: d99ee6f7cb23c2e397b50a3099b005614d064c5c. Масштаб средний, режим «дерево», группы последовательно.
Гейт: pnpm lint && pnpm test && pnpm build.
Живых образцов нет: поведение — анимации и прокрутка, проверяются стендом dev/harness.html и живым amo (8.3, креды — local/dev-amo-creds.md).
Вне плана: 8.3 (живой amo) и 8.4 (PR, аудит, архив, мерж) — делает координатор после G7.
G1 (1.1) выполнил координатор сам: issue #38, ветка feature/38-picker-motion — кода нет, агент не нужен.
Решение: волна 2 идёт последовательно G2 → G3 → G6 (дерево общее; стенд грузит dist — параллельные сборки перетирали бы друг друга).

### G1 · Issue и ветка

Issue #38 заведено с меткой enhancement и назначено на себя, ветка feature/38-picker-motion от свежего master.
Коммит несёт артефакты change (proposal, design, specs, tasks) и plan.md.
Аудит не нужен: кода нет, проверка — gh issue view 38 (OPEN, назначен) и git branch --show-current.

### G2 · Чистая логика прокрутки

centerScrollLeft, sectionScrollPlan (прыжок только при строгом >), createScrollLock, scrollMotion с тестами.
Решения: верхняя граница centerScrollLeft — max(scrollWidth - width, 0); schedule в createScrollLock необязательный (по умолчанию scheduleTimeout); повторный lock того же раздела onChange не зовёт; scroll() без удержания таймер не ставит.
Отступление: удаление revealScrollLeft перенесено в G5.
Аудит: ok с первого круга.
Долг: K3 в plan.md пишет schedule обязательным и ScheduleTimer из hoverPopup.ts (фактически необязательный, тип из hoverPopup.types.ts); jsdoc dispose не говорит, что current() после него отдаёт последнее значение; подключение K1–K4 проверяет итоговый аудит.

### G3 · Плитка «Создать стикер»

StickerSection.hasCreateTile (K5): слотов items.length + 1, плитка на последнем ряду раздела; плитка только у custom, подсказка CUSTOM_HINT удалена. PlusIcon перенесён в Picker/PlusIcon (K6).
CreateTile лежит в StickerFeed/CreateTile/; переход motion-safe:transition-colors duration-base (K8); приглушённые цвета подобраны по стенду: рамка cadetGray-30/.4, знак /.6, тёмная — white-0/.2 и /.4.
Стенд (исполнитель, headless Chrome): пустой раздел, 3 и 5 стикеров, обе темы, hover/focus, Tab, Enter → «Добавить стикеры», без контекстного меню, новый стикер встаёт перед плиткой.
Аудит: ok с первого круга.
Долг: CreateTile в FeedRow без явного key после ячеек с ключами.
