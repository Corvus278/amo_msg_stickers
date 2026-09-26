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
