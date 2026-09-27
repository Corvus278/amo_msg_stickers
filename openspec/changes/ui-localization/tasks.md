## 1. Подготовка

- [x] 1.1 Issue «Интерфейс на языке amo (русский / английский)» с меткой `enhancement`, назначена на себя; ветка `feature/<номер>-ui-localization` от свежего `master`; версия — минор (`package.json`, `src/extension/manifest.json`, `@version` в `build.mjs`); проверка — `gh issue view <номер>` открыт и назначен, `git branch --show-current` совпадает, `node scripts/check-version.mjs` зелёный

## 2. Модуль языка и словари

- [x] 2.1 `src/core/i18n/locale.ts`: `resolveLocale(stored, languages)` и `readAmoLocale()` по design («Язык: `localStorage.i18nextLng`, затем `navigator.languages`»), `i18n.types.ts` с `Locale`; проверка — `tests/locale.test.ts`: `en-US`, `EN`, `en_GB`, `en` → `en`; `ru-RU`, `de-DE`, `''`, `null` при пустых языках → `ru`; `stored` важнее `languages`; пустой `stored` → `languages[0]`; `readAmoLocale` при бросающем `localStorage` берёт `navigator.languages`
- [x] 2.2 `messages.ru.ts` (`RU … as const satisfies Record<string, string>`), `messages.en.ts` (`EN: Messages`), `translate.ts`: `setLocale`, `getLocale` (по умолчанию `'ru'`), `t(key, params)` с типизированными подстановками `MessageParams<K>`, `LocalizedError` (`key`, `params`, текст — `t` при создании) по design («Словари — модули TS»); пока с ключами только для 2.3; проверка — `tests/translate.test.ts`: подстановка нескольких параметров, язык `en` после `setLocale`, `LocalizedError` сохраняет `key`/`params` и текст на текущем языке; для каждого ключа набор `{…}` в `EN` равен набору в `RU`; `pnpm typecheck` падает на временном вызове без обязательного параметра (проверить и убрать)
- [x] 2.3 `start(host)` в `app.ts` первой строкой ставит `setLocale(readAmoLocale())`; `title` кнопки стикеров — из словаря; проверка — на стенде с `localStorage.i18nextLng = 'en-US'` подсказка кнопки английская, без ключа и с `ru-RU` — русская

## 3. Перевод интерфейса пикера

- [x] 3.1 `ui/renderMessage` — сборка узлов по ключу с подстановкой-узлом (`{link}`) по design; проверка — юнит-тест: строка без подстановок — один текстовый узел, `{link}` в начале, середине и конце — узел на своём месте, соседний текст сохранён
- [x] 3.2 Панель, футер, экраны и заголовки: `Picker.tsx` (`aria-label`), `Footer/` (режимы, «Настройки», `aria-label="Режимы"`), `Screen/` («Назад»), `AddView/`, `SectionTabs/` (`aria-label` полосы, `AddButton/`), `StickerFeed/CreateTile/`; проверка — на стенде в английском языке эти элементы и их `title`/`aria-label` английские
- [x] 3.3 Режим «Стикеры»: `feedSections` («Недавние», «Пак пуст»), `packTitle(pack)` по design («„Мои стикеры“ — по id пака») в `feedSections`, `PackCover`, `PackMenuButton`, `finishImport`; `cellName` — целые фразы «Отправить стикер …» / «Send sticker …» и `aria-label` ячеек `StickerCell`/`MasonryCell` из них; меню `CellMenu` («Действия: …»), `RemoveItem`, `DeletePackItem`, `ClearRecentButton`; проверка — `tests/feedSections.test.ts`, `tests/cellName.test.ts`, `tests/finishImport.test.ts` обновлены и проходят на `ru`, добавлены кейсы `en`: раздел `custom` с `title: 'Мои стикеры'` в записи называется «My stickers», имя ячейки «Send sticker “hi”»; на стенде английский пак без обложки показывает буквы «My stickers»
- [ ] 3.4 Режим «GIF»: `GifView` (плейсхолдер поиска, «Ничего не нашлось», подсказка без ключей, «Открыть настройки»), `gifSections` («Недавние», «Тренды»), `FEED_LABELS` («GIPHY стикеры»); проверка — `tests/gifSections.test.ts` обновлён, на стенде в английском языке режим «GIF» без русского текста
- [x] 3.5 Формы: `CreateSticker/` (заголовок, подпись, кнопка, `DropZone`), `TelegramImport/` (заголовок, подсказка, «Импорт»), `SettingsView/` (заголовок, подписи полей, подсказки со ссылками через `renderMessage`, «Сохранить»); проверка — на стенде в обоих языках ссылки в подсказках кликабельны и стоят в фразе на своих местах
- [ ] 3.6 Статусы: `usePickerState` («Отправляю…», «Ошибка отправки»), `useStickerDraft` («Конвертирую…», размер `КБ`/`KB`, «Не получилось: …»), `useSettingsDraft` («Сохранено»), `useGifFeed` (префикс `GIF:`), `finishImport` («Пак «…» добавлен»); проверка — на стенде в английском языке статусы отправки, конвертации своего стикера и сохранения настроек английские

## 4. Ошибки на языке amo

- [ ] 4.1 Ошибки ядра в мире страницы — через `t()`: `sender.ts`, `app.ts` («Стикер удалён», «Поле ввода не найдено»), `convert.ts`, `tgs.ts`, `sources/telegram.ts`, `sources/gifs.ts`; проверка — `tests/sender.test.ts`, `tests/telegram.test.ts`, `tests/tgs.test.ts`, `tests/gifs.test.ts` проходят на `ru`, в каждом по кейсу `en` на одну ошибку
- [ ] 4.2 `net.ts`: `NOT_ALLOWED` и `tooBigError` — `LocalizedError` с ключом и параметром лимита в МБ; `httpError` не меняется; проверка — `tests/net.test.ts`: текст на `ru` прежний, на `en` — английский с тем же числом
- [ ] 4.3 Граница SW: `FetchResponse` при отказе несёт `key` и `params` для `LocalizedError`, `background.ts` их заполняет, `content.ts` пересоздаёт `LocalizedError` на своём языке, без `key` — `Error(error)` как сейчас; проверка — `tests/background.test.ts`: отказ по политике и по лимиту отдаёт `key`/`params`, сетевой сбой и HTTP — только `error`; юнит-тест клиента `content.ts` (или выделенной функции разбора ответа): ответ с `key` при языке `en` даёт английский текст
- [ ] 4.4 `gmNetwork.ts`: `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORT_ERROR`, `BODY_NOT_BYTES` — из словаря; проверка — `tests/gmNetwork.test.ts` проходит, кейс `en` на сетевую ошибку
- [ ] 4.5 Остатков не осталось: `rg -n '[А-Яа-яЁё]' src -g '*.ts' -g '*.tsx' | rg -v ':\s*(\*|//|/\*\*)'` находит только `messages.ru.ts` и ошибки-инварианты из non-goals design (`usePicker`, `usePickerView`, `useMenuClose`, `fileName.ts`, `background.ts` «Неизвестный формат ответа»)

## 5. Язык поиска GIF

- [ ] 5.1 `sources/gifs.ts`: язык — аргумент запроса; GIPHY `lang` в `search` GIF и стикеров, KLIPY `locale` (`ru_RU`/`en_US`) в `search` и `featured`; `useGifFeed` передаёт `getLocale()`; проверка — `tests/gifs.test.ts`: для `ru` и `en` параметры в URL поиска GIPHY и поиска и трендов KLIPY, у трендов GIPHY `lang` нет

## 6. Метаданные сборок

- [x] 6.1 `src/extension/_locales/{ru,en}/messages.json` с `extDescription`; `manifest.json` — `default_locale: "ru"`, `description: "__MSG_extDescription__"`; `build.mjs` копирует `_locales` в `dist/extension/`; проверка — после `pnpm build` в `dist/extension/_locales/{ru,en}/messages.json` есть, `dist/extension/manifest.json` ссылается на `__MSG_extDescription__`; распакованное расширение загружается в Chrome без ошибки manifest
- [x] 6.2 `USERSCRIPT_BANNER`: `@description` (ru) и `@description:en`; проверка — `tests/userscriptBanner.test.ts` проверяет обе строки и что `@name` один

## 7. Стенд, документация, проверка

- [x] 7.1 `dev/harness.html`: переключатель «язык amo: ru / en» пишет `localStorage.i18nextLng` и перезагружает стенд; проверка — после переключения на `en` пикер английский, обратно — русский
- [ ] 7.2 Стенд в английском, светлая и тёмная тема: чипы источников, кнопки футера, «Save to “My stickers”», подтверждения «Really clear?» / «Really delete?», строка статуса не переносятся и не обрезаются там, где русские строки помещаются; проверка — скриншоты обоих языков и тем
- [ ] 7.3 Живой amo (`web.dev.amo.tm`, `local/dev-amo-creds.md`): Chrome с `--lang=en-US` — amo и пикер на английском, `localStorage.i18nextLng` = `en-US`; отправленный стикер у получателя с русским amo — стикер без пузыря; поиск GIF уходит с `lang=en`; ошибка лимита в расширении — на английском; то же с `--lang=ru-RU` — всё на русском
- [ ] 7.4 `CLAUDE.md`: модуль `core/i18n/` в «Структуре», раздел «Язык интерфейса» в «Как работает» (источник языка, словари, ошибки через SW, `packTitle`), правило «строки интерфейса — только через словарь»; проверка — `pnpm lint` и `pnpm test` зелёные
