# План прогона: sticker-message-style

База прогона: `58ca4afcb1e9afa51cd603bf4a667c811d50178c`
Гейт: `pnpm lint && pnpm test`
Быстрые проверки: `pnpm typecheck`, `pnpm exec vitest --project=unit --run tests/fileName.test.ts`
Долгие слои: `pnpm build` + стенд `dev/harness.html` (`python3 -m http.server 8777 -b 127.0.0.1`) — G2, G4;
живой amo `web.dev.amo.tm` через chrome-devtools MCP (:9222, логин — пользователь) — G3, G5
Хук коммита: `pnpm typecheck` по всему проекту + `vitest --changed` — каждый коммит группы зелёный; G2 — один коммит.
Ни одного коммита в `master`: G1 первым делом создаёт ветку `feature/21-sticker-message-style`.

## Контракты

- **K1 формат имени** — `buildStickerFileName` даёт `[метка.]amostk.k-<sticker|gif>[.<ключ>-<значение>]*.gif`;
  любое имя содержит `amostk.`, стикер — `.k-sticker.`, GIF — `.k-gif.` (и без метки). CSS G4 ловит именно
  `img[alt*="amostk."]` и `[alt*=".k-sticker."]`. Владелец G1; потребители G2, G4.
- **K2 `sendFileName(item: SendItem, sticker)`** — из `src/core/fileName.ts`; `local` → `sticker`, метка
  `caption || emoji`; `remote` → `gif`, метка `gif.title`. Владелец G1; потребитель G2 (`app.ts` `toFile`).
- **K3 `StickerRec.caption?: string | undefined`** — в `db.types.ts`, `DB_VERSION` = 1. Владелец G1; потребители G2
  (`useStickerDraft` пишет), G1 (`sendFileName` читает).
- **K4 разметка ленты** — селекторы пузыря, хвоста, подложки, медиа ленты, цитаты, пересылки, подписи и способ
  задания размера записаны в `design.md` (разделы «CSS», «Open Questions»). Владелец G3; потребители G4, G5.
- **K5 `injectMessageStyle()`** — из `amoDom.ts`, один `<style id="amo-stickers-message">` в `document.head`,
  `start()` зовёт до первого `scan()`. Владелец G4; потребитель G5.

## Группы

### G1 · Ветка, версия, модуль имени · M · волна 1

- Задачи: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2
- Зависит от: —
- Файлы: `package.json`, `src/extension/manifest.json`, `build.mjs`, `src/core/fileName*.ts`, `src/core/db.types.ts`,
  `tests/fileName.test.ts`
- Требования: `sticker-sending` → «Метка в имени файла»; `custom-stickers` → «Сохранение в «Мои стикеры»» (поле)
- Design: «Модуль имени», «Вычистка и обрезка метки», «Откуда вид и метка», «Подпись своего стикера»
- Контракты: вводит K1, K2, K3
- Усиление проверок: 2.6 — точные строки из сценариев спеки литералами, а не только круг «сборка → разбор»;
  разбор рукописных литералов; байты — `new TextEncoder().encode(...).length` в тесте; для K1 — каждое имя
  (оба вида, с меткой и без) содержит `amostk.` и `.k-<вид>.`; 3.2 перенесена сюда: `sendFileName` читает `caption`

### G2 · Имя на путях отправки · M · волна 2

- Задачи: 3.1, 3.3, 3.4
- Зависит от: G1
- Файлы: `src/core/sender.ts`, `tests/sender.test.ts`, `src/core/ui/Picker/useStickerDraft/**`,
  `src/core/ui/Picker/AddView/CreateSticker/**`, `src/core/app.ts`
- Требования: `sticker-sending` → «Метка в имени файла»; `custom-stickers` → «Сохранение в «Мои стикеры»»
- Design: «`sender.ts` принимает готовое имя», «Подпись своего стикера», «Откуда вид и метка»
- Контракты: потребляет K2, K3
- Усиление проверок: 3.1 — тест, что имя уходит в `File.name` без добавления/замены расширения; 3.3 — в отчёте
  значение `caption` из IndexedDB стенда (DevTools MCP) после правки поля и «Сохранить» до debounce; 3.4 — в отчёте
  четыре имени из `[harness] attached`, `rg "'sticker'|'gif'" src/core/app.ts` не находит старых имён

### G3 · Разметка ленты в живом amo · S · волна 2

- Задачи: 4.1
- Зависит от: —
- Файлы: `openspec/changes/sticker-message-style/design.md`
- Требования: `chat-message-style` → «Область стиля», «Размер стикера как в Telegram»
- Design: «CSS — глобальный `<style>` из `amoDom.ts`», «Open Questions»
- Контракты: вводит K4
- Усиление проверок: селекторы проверены в живом amo `document.querySelectorAll` на каждом из пяти мест (лента,
  цитата, пересылка, просмотрщик, список чатов) — счёт совпадений в отчёте; хэши CSS-модулей в селекторах запрещены

### G4 · Стиль сообщений в ленте · M · волна 3

- Задачи: 4.2, 4.3, 4.4
- Зависит от: G2 (`app.ts`), G3 (K4)
- Файлы: `src/core/amoDom.ts`, `src/core/app.ts`, `dev/harness.html`
- Требования: `chat-message-style` → все четыре Requirement
- Design: «CSS — глобальный `<style>` из `amoDom.ts`», «Стенд»
- Контракты: потребляет K1, K4; вводит K5
- Усиление проверок: разметку и способ задания размера в моке брать из записи G3 в `design.md`, не подгонять под
  свой CSS; на стенде — числа `getBoundingClientRect` img и контейнера: 512×512 → 208×208, 512×256 → 208×104,
  128×128 → 128×128, контейнер = img; GIF с меткой = без метки; у ответа с цитатой `getComputedStyle` пузыря —
  фон не `none`; `#amo-stickers-message` ровно один

### G5 · Приёмка в живом amo · S · волна 4

- Задачи: 5.1, 5.2, 5.3, 5.4
- Зависит от: G4
- Файлы: `openspec/changes/sticker-message-style/design.md`, правки селекторов — `src/core/amoDom.ts`
- Требования: `chat-message-style` → все; `sticker-sending` → «Метка в имени файла»
- Design: «Risks / Trade-offs»
- Контракты: потребляет K4, K5
- Усиление проверок: сборка подключается в живой amo (как `local/desktop/devtools-loader.js`); здесь же живая часть
  4.3 — стиль есть, CSP не блокирует; размеры — числами `getBoundingClientRect`, вид — скриншоты четырёх сочетаний;
  5.1 — второй аккаунт входит пользователь

### G6 · Документация и гейт · S · волна 5

- Задачи: 6.1, 6.2, 6.3
- Зависит от: G5
- Файлы: `CLAUDE.md`, `README.md`
- Требования: —
- Design: —
- Контракты: описывает K1, K5 по коду ветки
- Усиление проверок: 6.1 — `rg "sticker\.gif" CLAUDE.md` находит только упоминание старых сообщений, не имя отправки

### G7 · PR, аудит, архив, мерж · S · волна 6

- Задачи: 7.1, 7.2, 7.3, 7.4
- Зависит от: G6
- Файлы: `openspec/**` (архив)
- Требования: —
- Design: —
- Контракты: —
- Усиление проверок: выполняет координатор прогона по «Воркфлоу задачи» `CLAUDE.md`; мерж — только после зелёного CI

## Волны

1. G1
2. G2, G3 — файлы не пересекаются (код / `design.md`); логин в amo просить на старте волны
3. G4
4. G5
5. G6
6. G7
