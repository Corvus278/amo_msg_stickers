# Журнал прогона

Решения без заказчика, отступления от спеки, итоги аудитов и долг прогона change `english-user-docs`.

## 2026-09-28

### Масштаб

Масштаб поднят с малого до среднего: 12 задач, но три независимых слоя (сайт VitePress и ~750 строк перевода, ядро со ссылками и тестами, README/CLAUDE.md/версия). Пользователь спит и просил довести до релиза без вопросов: решения по ходу принимает координатор, вопросы — в журнал. Скрины не переснимаются (решение пользователя).

### G1 · Каркас английской локали сайта

Локаль en в config.mts: русские nav/sidebar/подписи — в locales.root без правки текста, en — свои nav/sidebar (K2), подписи темы, notFound; поиск — search.options.locales {root, en}.
CopyCode.vue: язык по useData().lang, /^en(?:-|$)/i, таблица подписей ru/en.
Аудит: ok с первого круга. docs:build проходит, переключатель на /install/firefox ведёт на /en/install/firefox.
Долг: skipToContentLabel не задан ни в одной локали (на русских страницах «Skip to content») — поправить в G5.

### G2 · Перевод: главная и установка

Английские главная, установка (index, chromium, firefox, safari, desktop) и фрагмент _parts/en/userscript.md; include из en/install — ../../_parts/en/userscript.md (в плане ошибочно ../).
typograf en-US прогнан по тексту скриптом с защитой разметки: целиком по файлу typograf ломает markdown (- theme → — theme, ::::tabs, ../).
Оговорка про Edge «Загрузить распакованное» опущена: в английском Edge кнопка тоже Load unpacked.
Аудит: круг 1 critical — обычный пробел перед «—» (25 мест), круг 2 ok.
Долг: «No guarantees» без nbsp (safari.md:5, firefox.md:12) — поправить в G5.

### G3 · Перевод: настройка, обновление, FAQ, приватность

Английские setup/gif-keys, setup/telegram, update, faq, privacy; docs:build без битых ссылок, в dist/en/ 11 страниц.
Строки ошибок интерфейса в тексте — с типографским апострофом (typograf), статусы импорта — жирным; alt скрина GIF без русского запроса.
Аудит: ok с первого круга; мелкий долг поправлен тем же исполнителем без повторного аудита (координатор сверил: nbsp внутри code-span — 0): nbsp в `Stickers for amo`, двусмысленная фраза в privacy, границы статусов в telegram.
Урок: скрипт typograf ставит nbsp и в code-span — после прогона чистить код.

### G4 · Ссылки из интерфейса по языку и тесты

userDocsUrl(page, locale) с LOCALE_PREFIX: Record<Locale, string> (ru '', en 'en/'); константы GIF_KEYS_DOCS_URL/TELEGRAM_DOCS_URL убраны, адрес считается в рендере через getLocale() в SettingsView, GifView, TelegramImport. EN-строки ссылок без «(in Russian)».
Тесты: userDocs.test.ts — страницы на обоих языках, адреса ru/en литералами, префикс en сверяется с link локали в config.mts; userDocsPages.test.ts — пары страниц через import.meta.glob (зубы проверены удалением страниц в обе стороны).
Отступление: глобальный interface ImportMeta { glob } в src/types.d.ts — в одной программе TS тестовый тип иначе не изолировать (vite/client не резолвится, отдельный tsconfig для tests выходит за группу). Риск: ядро видит тип import.meta.glob; в src/ import.meta не используется.
Аудит: ok с первого круга; перестановка JSDoc в types.d.ts сделана без повторного аудита.
Долг (не делаем): защита no-restricted-syntax на MetaProperty в src/core/** — по желанию.
