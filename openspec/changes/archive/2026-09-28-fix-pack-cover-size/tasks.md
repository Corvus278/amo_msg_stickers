## 1. Подготовка

- [x] 1.1 Ветка `fix/57-pack-cover-size` от свежего `master`; версия 0.14.0 → 0.14.1 в `package.json`,
  `src/extension/manifest.json` и `@version` в `build.mjs` — проверка: `node scripts/check-version.mjs --base
  origin/master` без ошибок

## 2. Ключ кэша обложек

- [x] 2.1 `src/core/ui/Picker/PackCover/coverBitmaps/coverBitmaps.ts`: `coverBitmapKey(id, side)` — ключ кадра
  обложки по стикеру и стороне холста, с jsdoc «почему»: кадр декодируется под сторону холста, и холст другой стороны
  не должен получить чужой кадр. `CoverBitmaps` в `coverBitmaps.types.ts` описан как кэш по ключу кадра, а не по id
  стикера — проверка: `pnpm typecheck`
- [x] 2.2 `src/core/ui/Picker/PackCover/useCoverCanvas/useCoverCanvas.ts`: ключ нарисованного кадра и ключ запроса к
  кэшу — один `coverBitmapKey(id, side)` — проверка: `pnpm typecheck`, eslint по файлу
- [x] 2.3 `tests/coverBitmaps.test.ts`: тот же стикер с другой стороной декодируется заново и получает свой битмап, с
  той же стороной — битмап из кэша без повторного декодирования; ключи разных сторон и разных стикеров различаются —
  проверка: `pnpm test` зелёный

## 3. Проверка

- [x] 3.1 Стенд `dev/harness.html` с паком из GIF: попап открыт при DPR 2, эмуляция DPR 1, перерисовка полосы —
  кадр обложки вписан в квадрат (прозрачные поля сверху и снизу у кадра 256×193), а не залит на весь холст; пять
  открытий и закрытий подряд — размер обложки не меняется
- [x] 3.2 `pnpm lint` и `pnpm test` — без ошибок и предупреждений
