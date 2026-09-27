# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `ui-localization`.

## 2026-09-27

### Решения по плану

- Литерал 'Мои стикеры' в db.ts (ensureCustomPack) задачами не покрыт — отдан G3, перевод через t (Impact спеки его называет, проверка 4.5 найдёт).
- 3.2, 3.5, 3.6: к проверке стендом добавлен rg по кириллице вне комментариев в файлах группы — пусто.
- 2.2: проверка типов словаря — временная, без @ts-expect-error (запрещён правилами линтинга).
- 1.1: ветка — git branch -m в worktree; база 19d817f сверяется с origin/master исполнителем G1.
- Исполнители идут по одному (дерево общее), G2 и G7 одной волны — последовательно.

### G1 · Модуль языка и словари

Issue #41, ветка feature/41-ui-localization (git branch -m), база 19d817f = origin/master; версия 0.12.0 — sed в трёх местах (дерево не чистое для pnpm version).
readAmoLocale читает глобальные localStorage/navigator; t(key, ...MessageArgs<K>) — параметры обязательны только у строк с подстановками; formatMessage экспортирована для теста подстановок.
setLocale(readAmoLocale()) — первая строка start(); ключ picker.title (подсказка кнопки) заведён в G1.
Аудит: ok с первого круга.
Долг: тест t/LocalizedError с непустыми params — когда появится ключ с подстановкой (G2+); picker.title занял префикс picker. из K2 (G2 учесть); стенд 2.3 аудитором не гонялся (исполнитель прогнал в headless Chrome).

### G2 · Каркас пикера и формы

renderMessage разделён на чистую renderTemplate (тест на синтетике) и renderMessage(key, nodes) с шаблоном текущего языка; подсказки со ссылками — одна строка с {link}.
t() зовётся в рендере, не в константах модуля: модуль вычисляется до setLocale в start().
Ключи: aria-label панели = picker.title; «GIF» → footer.gifs ('GIFs'); settings.title отдельно от footer.settings; подписи «GIPHY/KLIPY API key» — литералы без кириллицы.
Долг G1 закрыт: tests/translate.test.ts — t и LocalizedError с непустыми params (файл вне списка G2, только тесты).
Аудит: ok с первого круга.
Долг: renderMessage.ts держит свою таблицу {ru, en} + getLocale() вместо доступа к шаблону из translate.ts — второй источник выбора языка (кандидат для G8); стенд 3.2/3.5 аудитором не гонялся (исполнитель прогнал ru/en).

### G7 · Метаданные сборок и стенд

_locales/{ru,en}/messages.json, manifest — __MSG_extDescription__ и default_locale ru; userscript — @description и @description:en, @name один.
Тексты описаний литералом и в messages.json, и в баннере build.mjs: тест баннера читает build.mjs как текст.
Стенд: select «язык amo» пишет i18nextLng и перезагружает; без ключа ничего не выбрано (пикер берёт язык браузера).
Отступление: немецкий Chrome напрямую не проверен (macOS не меняет язык интерфейса флагами); фолбэк на ru проверен сборкой без _locales/en. Загрузка расширения в Chrome — Extensions.loadUnpacked ok у исполнителя.
Аудит: ok с первого круга.
Долг: тест копирования _locales ищет cpSync в исходнике build.mjs, а не результат сборки (по плану); cpSync в pnpm watch — только при старте, правка messages.json не перекопируется.

### G3 · Режим «Стикеры»

packTitle называет свой пак по id (pack.custom), через него — feedSections, PackCover, finishImport; ensureCustomPack пишет t('pack.custom'), миграции нет.
cellName → { send, menu }, обе — целые фразы словаря; CellMenu получает готовый label; русские тексты не изменились.
status.packAdded (статус finishImport) заведён в G3 — для G4 часть 3.6 про finishImport уже сделана.
Отступление: translate.ts вне файлов группы — тип LocalizedError.params → MessageArgs<K>[0] (иначе TS2322 при ключах с разными подстановками); аудитор подтвердил мутацией, K3 не изменён.
Отступление: проверка стендом «пак без обложки — буквы My stickers» недостижима: свой пак без стикеров показывает смайл; буквы — только у паков Telegram (формулировку 3.3 поправить в /opsx:update).
Аудит: ok с первого круга. Долг: «Really delete?»/«Really clear?» юнит-тестами не покрыты (стенд — G8, 7.2).

### G4 · Режим «GIF», статусы, язык выдачи

FEED_LABELS → Record<GifFeed, MessageKey>, t в FeedChip (модуль грузится до setLocale); недавние GIF — свой ключ gifs.recent; статусы status.*, status.packAdded не дублировался.
«Powered by GIPHY/KLIPY» не переводится — атрибуция провайдеров, английская для обоих языков (осознанное исключение).
5.1: locale последним позиционным аргументом fetchGifs/giphy/klipy; GIPHY lang только с q, KLIPY ru_RU/en_US в поиске и трендах; useGifFeed передаёт getLocale() на каждый запрос.
Аудит: ok с первого круга. Долг: подпись чипа через t(FEED_LABELS[feed]) тестом не наблюдается (только стенд); «неожиданный ответ» в gifs.ts — G5.

### G5 · Ошибки ядра в мире страницы

Ошибки ядра — new Error(t(...)) / new SendError(t(...)) в момент броска (мир страницы, не LocalizedError); BAD_RESPONSE telegram.ts → badResponse(), NOT_LOTTIE tgs.ts → ключ: модули вычисляются до setLocale.
Один ключ error.source.badResponse «{source}: неожиданный ответ» для Telegram/GIPHY/KLIPY.
Не переведены осознанно: `Telegram: ${method} failed` (ok:false без description, технический текст, как HTTP <код>), недостижимые `Unknown …` exhaustive-ветки, fileName.ts:112 (ошибка программиста) — для 4.5 (G8) это исключения.
Отступление: ошибки app.ts и convert.ts юнит-тестом не покрыты (DOM amo / gif-worker:code); «занятое поле ввода» на en — только стенд (G8/G9).
Аудит: ok с первого круга. TS2322 в translate.ts:67 в IDE — устаревшая диагностика (исправлено в 55a633f), TS 6.0.3 и TS 7 чисты.

### G6 · Сетевые ошибки и граница SW

net.ts: notAllowedError()/tooBigError() → LocalizedError (error.net.notAllowed, error.net.tooBig с {size} МБ); NOT_ALLOWED и BODY_NOT_BYTES больше не экспортируются.
Граница SW — src/extension/fetchResponse.ts: toFailureResponse (background) / unwrapFetchResponse (content), тест через JSON; FetchResponse = FetchSuccess | FetchFailure.
Отступление (усиление K4): unwrapFetchResponse сужает key/params гардом isMessageArgs по RU, иначе Error(error) с текстом SW как есть.
gmNetwork.ts: NETWORK/TIMEOUT/ABORT/BODY_NOT_BYTES — ключи, new Error(t(KEY)) при броске; правка gmNetwork в 4.2 — вынужденная (удалён NOT_ALLOWED).
«Неизвестный формат ответа» в background.ts и 'fetch failed' не переводятся — инварианты (design Non-Goals).
Аудит: ok с первого круга. Долг: PLACEHOLDER в fetchResponse.ts дублирует регулярку translate.ts (кандидат на экспорт, G8); tests/net.test.ts:211 — unstubAllGlobals после expect, лучше afterEach.

### G8 · Остатки, раскладка, документация

4.5: rg по кириллице вне комментариев — только messages.ru.ts и инварианты design Non-Goals (background.ts:52, fileName.ts:112, usePickerView, usePicker, useMenuClose); в JSX — только placeholder t.me/addstickers/….
7.2: стенд en/ru × светлая/тёмная, замер в shadow root — английские строки не длиннее русских, ничего не обрезано; статус «занятое поле» переносится в 2 строки на обоих языках. Скриншоты — local/g8-shots/ (вне git).
7.4: в CLAUDE.md — «Структура» (i18n/, renderMessage/, packTitle/, fetchResponse.ts, _locales/), раздел «Язык интерфейса», правило «строки — только через словарь»; сверено аудитором с кодом.
Вне языка: на «Add stickers» при полной прокрутке строка статуса закрывает низ кнопки «Сохранить» ~9 px (ru и en одинаково) — кандидат в отдельный issue.
Аудит: ok с первого круга. Долг: рваный перенос CLAUDE.md:335; в тёмной теме нет снимков add/busy (раскладка от темы не зависит); долги renderMessage-таблицы и PLACEHOLDER в fetchResponse.ts остаются.
