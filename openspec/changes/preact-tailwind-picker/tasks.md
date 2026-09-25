## 1. Подготовка

- [ ] 1.1 Завести issue «UI пикера на Preact и Tailwind» и ветку `feature/<N>-preact-tailwind-picker` от свежего `master` по воркфлоу `CLAUDE.md`; проверка — `gh issue view <N>` открыт, `git branch --show-current` совпадает
- [ ] 1.2 Замерить размер `dist/extension/content.js` и `dist/amo-stickers.user.js` после `pnpm build` на `master` и записать цифры в описание будущего PR; проверка — цифры записаны

## 2. Сборка и токены

- [ ] 2.1 Добавить зависимости: `preact` в `dependencies`, `clsx` в `dependencies`, `tailwindcss@^3.4` и `postcss` в `devDependencies`; проверка — `pnpm i` без ошибок, версии в `package.json`
- [ ] 2.2 Включить JSX Preact в `tsconfig.json` (`jsx: react-jsx`, `jsxImportSource: preact`) и в общих опциях `build.mjs`; добавить `tailwind.config.ts` в `include` tsconfig, чтобы его видел projectService eslint; проверка — `pnpm typecheck` и `pnpm lint:es` проходят на пустом `.tsx`-компоненте
- [ ] 2.3 Создать `tailwind.config.ts`: `darkMode: 'selector'`, `content: ['src/core/ui/**/*.{ts,tsx}']`, палитра, `fontSize`, `boxShadow`, `dropShadow` на уровне `theme`, `borderRadius`, `fontFamily`, `spacing`, `transitionDuration`, `transitionTimingFunction`, `zIndex` в `extend` — значения один в один с токенами amo (D2); проверка — выборочная сверка 10 токенов (все цвета из таблицы в `design.md` Context, `text-xsm`, `rounded-lgx`, `duration-base`) с `dev/amo.css`
- [ ] 2.4 Создать `src/core/ui/picker.css` (директивы Tailwind, `:host { all: initial }`) и плагин esbuild в `build.mjs`: `onLoad` прогоняет `picker.css` через `postcss([tailwindcss(config)])`, отдаёт `loader: 'text'`, `watchFiles` — `src/core/ui/**/*.tsx` и `tailwind.config.ts`; проверка — `pnpm build` кладёт в оба бандла CSS с классом из тестового компонента, в `pnpm watch` новый класс в `.tsx` появляется в бандле без перезапуска

## 3. Фасад и каркас пикера

- [ ] 3.1 Написать `createPicker.tsx` (D5): хост с shadow root, `<style>` с CSS, `render(<Picker isOpen isDark onClose … />)` на каждое изменение, `PickerHandle` с `element`, `isOpen`, `open`, `close`, `setTheme`; проверка — типы `PickerHandle` в `*.types.ts`, `pnpm typecheck` проходит
- [ ] 3.2 Перевести `app.ts` с `new Picker` на `createPicker` без изменения логики кнопки, `toggle`, `scan` и закрытия по клику вне; проверка — дифф `app.ts` затрагивает только создание пикера и имя `host` → `element`
- [ ] 3.3 Написать `PickerProvider` (D6): `env`, `settings`, `packs` + `refreshPacks`, статус, `send` с «Отправляю…» и закрытием при успехе, кэш object URL `urlOf`/`dropUrl`; ошибка использования вне провайдера — исключение с понятным текстом; проверка — `pnpm typecheck`, `pnpm lint:es`
- [ ] 3.4 Написать `Picker` (панель 352×400, `position: fixed`, `bottom`/`right` как у попапа эмодзи, тень, радиус, анимация открытия 0.2 s), класс `dark` на корне по `isDark` (D4), Escape и `stopPropagation` в `keydown`; загрузка при открытии и выбор стартовой вкладки «GIF» при пустых недавних; проверка — на стенде попап открывается в той же точке, тема переключается сменой класса на `<html>`
- [ ] 3.5 Написать `StatusBar`, `EmptyState`, `Button` (основная, второстепенная, опасная), `TextInput`; проверка — визуальная сверка со скриншотом текущего пикера на стенде в обеих темах

## 4. Вкладки и представления

- [ ] 4.1 `Tabs`, `Tab`, `TabIcon` и иконки-компоненты (часы, плюс, настройки, смайл); вкладка пака — обложка, фолбэк на смайл для «Мои стикеры» и две буквы названия; выбранная вкладка через `aria-selected:`; из `icons.ts` остаётся только `stickerIcon`; проверка — порядок и подсказки вкладок совпадают с текущими на стенде
- [ ] 4.2 `StickerGrid`, `StickerCell` (отправка и удаление соседними кнопками, D8), `MasonryGrid`; занятая ячейка полупрозрачна и не кликается; проверка — `pnpm lint:es` без ошибок jsx-a11y, кнопка удаления видна только при наведении
- [ ] 4.3 `RecentView`: список недавних, удаление из недавних, пустое состояние; проверка — на стенде отправка поднимает элемент наверх, удаление убирает его
- [ ] 4.4 `useGifFeed` и `GifView` с `FeedChips`: поиск с debounce 350 мс, фокус в поиске при открытии, переключение ленты, подгрузка по скроллу за 200 px до конца, отмена устаревших ответов, «Ничего не нашлось», подпись «Powered by …», пустое состояние без ключей с переходом в настройки; проверка — на стенде с ключом GIPHY: быстрый ввод не даёт перемешанной выдачи, прокрутка подгружает страницы
- [ ] 4.5 `useConfirmPress` и `PackView`: заголовок пака, «Удалить пак» с подтверждением двойным нажатием (сброс через 2,5 с), удаление стикера с отзывом его object URL, пустые состояния для пака и «Мои стикеры»; проверка — на стенде первое нажатие меняет текст на «Точно удалить?», через 2,5 с текст возвращается
- [ ] 4.6 `useTelegramImport` и `TelegramImport`: прогресс-бар, статус ««название»: done/total», вкладка пака появляется после первого стикера, переход в пак по завершении; проверка — импорт пака с токеном бота на стенде доходит до N/N
- [ ] 4.7 `useStickerDraft` и `CreateSticker`: выбор файла кликом и перетаскиванием (drop не всплывает к amo), подпись с debounce 500 мс, превью на шахматке, размер и вес в статусе, сохранение в «Мои стикеры»; object URL превью отзывается при замене; проверка — на стенде перетаскивание картинки не прикрепляет её к сообщению, стикер с подписью сохраняется
- [ ] 4.8 `SettingsView` и `SecretField`: три поля с подсказками и ссылками, «Сохранить» со статусом «Сохранено»; проверка — после перезагрузки стенда значения на месте

## 5. Уборка и документация

- [ ] 5.1 Удалить `picker.ts`, `styles.ts`, `picker.types.ts` и `h()`; проверка — `rg -n "PICKER_CSS|from './picker'" src` пусто, `pnpm build` проходит
- [ ] 5.2 Обновить `CLAUDE.md`: стек (Preact, Tailwind 3 с токенами amo), структура `src/core/ui`, раздел о пикере и теме, сборка CSS плагином; проверка — в `CLAUDE.md` нет упоминаний `h()` и `styles.ts`
- [ ] 5.3 Поднять версию до 0.2.0 в `package.json`, `src/extension/manifest.json` и `@version` в `build.mjs`; проверка — `rg -n '0\.2\.0' package.json src/extension/manifest.json build.mjs` находит три строки

## 6. Проверка

- [ ] 6.1 `pnpm lint` и `pnpm test` без ошибок и предупреждений в новом коде; проверка — вывод команд
- [ ] 6.2 Сравнить размер бандлов с замером из 1.2 и записать разницу в PR; проверка — рост не больше ~10 КБ на бандл, иначе разобрать причину до PR
- [ ] 6.3 Полный ручной прогон на стенде `dev/harness.html` в светлой и тёмной теме по сценариям `openspec/specs/*` (composer-integration, gif-search, telegram-import, custom-stickers, sticker-library, sticker-sending): вкладки, отправка, блокировка при черновике, импорт, создание, удаление, настройки; проверка — все сценарии пройдены, расхождения с текущим пикером только в цвете ошибки
- [ ] 6.4 Проверка в живом amo (расширение и userscript): попап на месте эмодзи-попапа, стили amo не протекают в пикер и обратно, хоткеи amo не срабатывают при вводе в поиске, смена темы при открытом попапе; проверка — стикер отправлен, в консоли нет ошибок
- [ ] 6.5 PR с `Closes #<N>`, аудит и резолв тредов по воркфлоу `CLAUDE.md`; проверка — нерезолвнутых тредов нет, PR смержен squash
