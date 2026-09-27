# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `user-docs`.

## 2026-09-27

### Старт прогона

База прогона: 3ca6b8f1697e6bc793f0ce607720a38d010147be. Масштаб: средний, режим «дерево», группы последовательно.
Гейт: pnpm lint && pnpm test && pnpm build && pnpm docs:build (docs:build — с G1).
Вне групп: 6.3 — Pages включает автор. Проверки только у автора/после push: 2.2 и 6.1 (статусы и артефакт PR), 6.2 (деплой после мержа), 4.2 (чистый профиль Chrome), 4.4 (импорт пака реальным ботом), 4.5 (ключ и лимит KLIPY в Partner Panel).
Живых образцов нет: change — дока и подсказки, данных пользователя спека не трогает.

### G1 · Каркас сайта доки

vitepress 1.6.4 + vitepress-plugin-tabs 0.9.1 (точные версии), запасной вариант не нужен.
Отступление: overrides '@types/markdown-it': 14.1.2 в docs/pnpm-workspace.yaml — типы VitePress 1.x и плагина расходятся (isPunctCharCode), без override md.use не проходит типы; as unknown as запрещён.
export default в config.mts и theme/index.ts — требование VitePress, объяснено jsdoc.
Хук .claude/hooks/lint.sh гоняет tsc только по корневому tsconfig; docs/tsconfig проверяет pnpm typecheck.
docs:dev в браузере не кликали: поиск, тема, навигация проверены по сборке.
Аудит: ok с первого круга. Долг: override не описан в design.
