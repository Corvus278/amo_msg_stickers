## Context

Мотивация — в `proposal.md`. Текущее состояние:

- `src/core/ui/picker.ts` — класс `Picker`: Shadow DOM, `h()` поверх `document.createElement`, полный
  `replaceChildren` на каждый рендер, токен рендера и счётчик `gifSeq` против гонок асинхронной загрузки, формы с
  локальным состоянием в замыканиях.
- `src/core/ui/styles.ts` — CSS строкой; палитра в CSS-переменных `:host` и `:host([data-theme='dark'])`, значения
  скопированы из amo.
- `src/core/app.ts` пользуется пикером через `new Picker(host, { onSend, onClose })`, `picker.host`, `isOpen`, `open()`,
  `close()`, `setTheme()`. Хост пикера вставляется внутрь кнопки ради `position: fixed` от transform-контейнера поля
  ввода.
- Сборка — `build.mjs` на esbuild, IIFE, три точки входа; PostCSS и JSX в проекте нет. ESLint уже настроен на `.tsx`
  (react-hooks, jsx-a11y), правила `.claude/rules/react*.md` написаны под Preact.

Дизайн-токены amo web: Tailwind 3.4, палитра hex-литералами на уровне `theme` (заменяет стандартную палитру Tailwind,
имена вида `gray-30`, `cadetGray-30`, `blue-50`, `beige-70`), свои шкалы `fontSize`, `boxShadow`, `borderRadius`,
`spacing`, `transitionDuration`, `darkMode: 'selector'` с классом `dark` на `<html>`. Пар light/dark у токенов нет —
тёмная тема пишется `dark:`-вариантами. Текущие цвета пикера уже совпадают с токенами: `#fff` = `white-0`, `#363b44` =
`gray-30`, `#94a5b2` = `cadetGray-30`, `#3c72fe` = `blue-50`, `#303030` = `gray-10`, `#e7e7e7` = `gray-40`, `#909090` =
`gray-70`, `#ecc498` = `beige-70`. Исключение — `--danger: #e5484d`: такого токена нет.

## Goals / Non-Goals

**Goals:**

- Декларативный UI пикера на Preact по правилам `.claude/rules/react*.md`.
- Стили только утилитами Tailwind на токенах amo; ни одного hex-литерала цвета в компонентах.
- Контракт пикера для `app.ts` — тот же набор операций, правки `app.ts` — только в месте создания.
- Сборка обеих целей и `watch` работают без отдельного шага CSS.

**Non-Goals:**

- Кнопка стикеров в поле ввода: остаётся в DOM amo на его классах, Preact её не рендерит.
- Изменение поведения, текстов, набора вкладок и форм; анимация закрытия попапа.
- Тесты компонентов (DOM-окружение в vitest): UI по-прежнему проверяется на стенде и в живом amo.
- Общая с amo сборка токенов (npm-пакет, импорт конфига amo): токены копируются.

## Decisions

### D1. Tailwind 3.4, а не 4

- **Совместимость с Shadow DOM.** Tailwind 4 регистрирует служебные переменные (`--tw-shadow`, `--tw-translate-*`,
  `--tw-ring-*`) через `@property`, а `@property` внутри shadow root игнорируется — тени, трансформации и кольца
  ломаются без хака с инъекцией в `document`. Tailwind 3 объявляет те же переменные в `*, ::before, ::after` и
  работает внутри shadow root как есть; его preflight с 3.4 покрывает и `:host`.
- **Паритет с amo.** Конфиг токенов amo написан под Tailwind 3 (JS-объект `theme`), переносится почти построчно;
  при v4 его пришлось бы переводить в `@theme` и сверять вручную.
- **Альтернатива: Tailwind 4 + `@property` в `document`.** Работает, но пишет в глобальную страницу amo, что
  противоречит требованию изоляции стилей.

### D2. Токены копируются в `tailwind.config.ts`

- Палитра, `fontSize`, `boxShadow`, `dropShadow` задаются на уровне `theme` (заменяют стандартные, как в amo);
  `borderRadius`, `fontFamily`, `spacing`, `transitionDuration`, `transitionTimingFunction`, `zIndex` — в
  `theme.extend`. Имена и значения — один в один с amo, чтобы класс из вёрстки amo значил в пикере то же самое.
- Копируются группы целиком, а не только используемые цвета: JIT генерирует CSS только по встреченным классам,
  лишние токены в бандл не попадают, а сверка с amo остаётся построчной.
- Прозрачные оттенки (`--hover`, `--border`, `--input-bg`) — модификатор прозрачности на токене:
  `bg-cadetGray-30/[.14]`, `border-white-0/10` и т. п.
- `--danger` (`#e5484d`) заменяется ближайшим токеном `red-30` (`#eb5757`) — единственное видимое расхождение цвета.
- Значения сверяются с собранным CSS amo (`dev/amo.css`), источник правды — tailwind-конфиг amo web.
- **Альтернатива: импорт конфига amo из соседнего репозитория.** Отброшена: репозиторий публичный, собираться должен
  без исходников amo.

### D3. CSS собирается плагином esbuild и вставляется `<style>` в shadow root

- `src/core/ui/picker.css` содержит `@tailwind base; @tailwind components; @tailwind utilities;` и стили `:host`
  (`all: initial` против наследуемых свойств страницы). Компонент импортирует его как текст.
- Плагин esbuild в `build.mjs` на `onLoad` для `picker.css` прогоняет файл через `postcss([tailwindcss(config)])` и
  отдаёт результат с `loader: 'text'`; в `watchFiles` — все `src/core/ui/**/*.tsx` и `tailwind.config.ts`, чтобы
  новый класс в компоненте пересобирал CSS в `watch`. В проде CSS минифицируется вместе с бандлом.
- `content` Tailwind — `src/core/ui/**/*.{ts,tsx}`.
- **Альтернатива: Tailwind CLI отдельным шагом до esbuild.** Два процесса в `watch` и промежуточный файл в дереве;
  плагин проще и держит всё в одной сборке.
- **Альтернатива: `adoptedStyleSheets`.** Даёт то же самое; `<style>` оставлен как единственный путь, который уже
  проверен в обеих целях.

### D4. Тёмная тема — класс `dark` на корне внутри shadow root

`darkMode: 'selector'` (как в amo) генерирует `:where(.dark, .dark *)`. Класс `dark` на `<html>` страницы не виден
селекторам внутри shadow root, поэтому корневой элемент пикера получает `dark` из пропа `isDark`. `app.ts` по-прежнему
отслеживает `html.class` и вызывает `setTheme()`.

### D5. Фасад `createPicker` поверх `render()` Preact

- `createPicker(env, callbacks)` возвращает `PickerHandle`: `element` (хост с shadow root), `isOpen`, `open()`,
  `close()`, `setTheme(isDark)`. Внутри фасад хранит `{ isOpen, isDark }` и на каждое изменение вызывает
  `render(<Picker … />, shadowRoot)` — Preact диффит дерево, состояние компонентов сохраняется между открытиями
  (последняя вкладка, запрос поиска GIF).
- Закрытие изнутри (Escape, успешная отправка) идёт через проп `onClose` → фасад ставит `isOpen = false`,
  перерисовывает и вызывает `callbacks.onClose`.
- Загрузка при открытии (настройки, `ensureCustomPack`, паки, выбор стартовой вкладки по пустым недавним) — эффект на
  переход `isOpen` в `true`.
- **Альтернатива: внешний стор с подпиской (`useSyncExternalStore`).** Тянет `preact/compat` или свой хук ради двух
  флагов; повторный `render()` решает то же без новых сущностей.

### D6. Дерево компонентов и состояние

```
ui/
  createPicker.tsx          фасад D5
  picker.css                вход Tailwind
  icons.ts                  stickerIcon — svg-строка для кнопки в DOM amo
  Picker/
    Picker.tsx              панель: шапка, тело, статус, вкладки; Escape и stopPropagation
    PickerProvider/         контекст: env, настройки, паки, статус, отправка, кэш object URL
    Tabs/ Tab/ TabIcon/     нижняя панель вкладок, иконки — компоненты
    RecentView/ GifView/ PackView/ AddView/ SettingsView/
    GifView/FeedChips/, AddView/TelegramImport/, AddView/CreateSticker/, SettingsView/SecretField/
    StickerGrid/ StickerCell/ MasonryGrid/ EmptyState/ StatusBar/ Button/ TextInput/
    useGifFeed/ useObjectUrls/ useStickerDraft/ useTelegramImport/ useConfirmPress/ usePickerView/
```

- Правила `react*.md`: компонент — папка с одноимённым файлом, типы в `*.types.ts`, логика — в хуках отдельных
  файлов, хуки возвращают методы, хендлеры `handle{Объект}{Событие}` объявляются в компонентах.
- `PickerProvider` держит общее: `env`, `settings`, `packs` + `refreshPacks`, статус (`showStatus`, `showError`,
  `clearStatus`), `send(item)` (статус «Отправляю…», ошибка в статус, закрытие при успехе) и кэш object URL стикеров
  (`urlOf(id, blob)`, `dropUrl(id)`).
- `useGifFeed(feed, query)` — пагинация, подгрузка по скроллу (порог 200 px), отмена устаревших ответов через
  счётчик запроса в `ref`, debounce поиска 350 мс.
- `useStickerDraft` — источник, подпись с debounce 500 мс, пересборка GIF, превью; object URL превью отзывается при
  замене и размонтировании.
- `useConfirmPress` — двойное нажатие вместо `confirm()` со сбросом через 2,5 с.
- Константы и тексты переносятся из `picker.ts` без изменений.

### D7. Классы: варианты Tailwind вместо переключения классов

- Состояния — вариантами по атрибутам: `aria-selected:` у вкладок, `aria-pressed:` у чипов, `disabled:` у кнопок,
  `group-hover:` для кнопки удаления в ячейке, `dark:` для темы. Условные классы, которые вариантом не выразить
  (занятая ячейка, drop-зона при перетаскивании), собираются `clsx`.
- `tailwind-merge` не берём: классы пишет только пикер, конфликтующих утилит на одном элементе нет by design, а
  merge тянет ~7 КБ и отдельный конфиг под нестандартные токены.

### D8. Разметка под jsx-a11y

- Ячейка стикера — обёртка с двумя соседними `<button>`: «отправить» на всю ячейку и «удалить» поверх. Вложенная
  кнопка в кнопке — невалидный HTML, а `div role="button"` без обработчика клавиатуры не пройдёт jsx-a11y.
- «Открыть настройки» в пустой ленте GIF — `<button>` со стилем ссылки: `href="#"` запрещён `anchor-is-valid`.
- Поля форм связаны с подписями через `<label>`.

### D9. События в Shadow DOM

Preact вешает слушатели прямо на элементы, без делегирования на корень, поэтому `stopPropagation()` в `keydown` корня
пикера по-прежнему не пускает хоткеи к amo, а `preventDefault()` + `stopPropagation()` на `drop` зоны загрузки — не
даёт amo прикрепить файл к сообщению.

## Risks / Trade-offs

- [rem считаются от `<html>` страницы, а не от shadow root] → amo задаёт `html { font-size: 16px }`, как и дефолт
  браузера; шкалы Tailwind и токенов amo рассчитаны на это. Проверка на стенде и в живом amo.
- [Preflight Tailwind против наследования со страницы] → `:host { all: initial }` обрывает наследование, preflight
  задаёт базу внутри shadow root; шрифт и цвет текста корня — `font-primary text-xsm text-gray-30 dark:text-gray-40`.
- [Токены amo поменяются] → копия устареет молча. Сверка по `dev/amo.css` описана в задачах; расхождение видно на
  стенде рядом с родной вёрсткой.
- [Видимое изменение цвета ошибки] → `#e5484d` → `red-30`. Принято: цвет становится токеном amo.
- [Рост бандла] → Preact ~4 КБ gzip; CSS только используемых утилит плюс preflight ~3 КБ. Размер `dist` сверяется
  до и после.
- [Регресс поведения при переписывании 900 строк] → ручной прогон всех сценариев пикера на стенде и в amo по
  спискам в `openspec/specs/*` перед PR.

## Migration Plan

Один PR, версия 0.2.0. Данные IndexedDB и настройки не трогаются — обновление прозрачно для пользователя. Откат —
revert PR.
