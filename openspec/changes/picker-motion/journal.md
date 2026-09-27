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

### Уточнение K8

motion-safe:transition-* несёт длительность по умолчанию (175ms) в @media-блоке, который идёт после простого duration-* и перебивает его. Поэтому длительность пишется тоже под motion-safe: (motion-safe:duration-base / motion-safe:duration-lg). Для duration-base безвредно (= 175ms), для duration-lg — нет. Касается G5 (SectionTabs, Footer) и CreateTile из G3 (duration-base — безвредно, привести при случае).

### G6 · Появление и наведение

Появление ModePanel (opacity), Screen (opacity + сдвиг 8px, duration-lg), меню (переход только после замера, isPlaced), строки статуса; всё под motion-safe:, длительность тоже под motion-safe: (уточнение K8).
Наведение: Button primary/danger через enabled:hover, FeedChip — подложка только у aria-pressed=false (специфичность), DropZone — hover: (это <label>, :enabled неприменим), «Открыть настройки» — без transition (text-decoration не анимируется). «Импорт» disabled при пустой/пробельной ссылке (hasLink).
Стенд (исполнители, headless Chrome): первые кадры op=0, reduce → 0s; прокрутка переживает переключение режима; меню без кадра в углу; ошибка черновика в ту же плашку; hover в обеих темах.
Эстафета: 5.x — один исполнитель, 6.x — новый (63 вызова у первого). Аудит: ok с первого круга.
Долг: нет юнит-теста на hasLink (testing.md просит тесты хуков с логикой); Button danger нигде не используется — наведение проверено только по собранному CSS.
