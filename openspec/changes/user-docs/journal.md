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

### G2 · Автообновление userscript и CI

@updateURL/@downloadURL — только при !isWatch (как devMatches), адрес в LATEST_USERSCRIPT_URL; тест проверяет ветку и адрес по build.mjs.
release.yml: убран неиспользуемый VERSION из env gh release create.
pages.yml: contents: read на уровне workflow, pages/id-token: write только у deploy; deploy needs build; upload-pages-artifact@v5, deploy-pages@v5; configure-pages не нужен (base жёсткий).
Аудит: ok с первого круга. Долг: paths pages.yml без корневого package.json (скрипт docs:build) — так в design; старое имя архива в README/CLAUDE.md — задачи 5.1/7.2.
Статусы PR, артефакт и деплой — проверка после push/мержа.
