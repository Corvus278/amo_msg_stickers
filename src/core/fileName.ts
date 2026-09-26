import type { SendItem } from './db.types';
import type {
  ParsedStickerFileName,
  StickerFileKind,
  StickerFileNameParams,
  StickerLabelSource,
} from './fileName.types';

/**
 * Имя отправляемого файла amo stickers: `[метка.]amostk.k-<вид>[.<ключ>-<значение>]*.gif`. По маркеру и виду в имени
 * (оно же `alt` картинки в ленте) CSS узнаёт сообщение, отправленное amo stickers.
 */

const MARKER = 'amostk';

const KIND_KEY = 'k';

/**
 * Других форматов сейчас нет: всё, что отправляется, приведено к GIF.
 */
const EXTENSION = 'gif';

/**
 * Без точек и дефисов в ключе и значении разбор однозначен: точка делит сегменты, первый дефис — ключ и значение.
 */
const PARAM_KEY = /^[a-z][a-z0-9]*$/;
const PARAM_VALUE = /^[a-z0-9]+$/;
const EXTENSION_SEGMENT = /^[a-z0-9]+$/;

/**
 * Имя из двух сегментов — маркер с расширением или метка с маркером без расширения: в обоих нет ни вида, ни места
 * под него, такое имя не считается именем amo stickers.
 */
const MIN_SEGMENTS = 3;

/**
 * Где искать маркер: сначала сегмент 1 (сегмент 0 — метка), затем сегмент 0 (метки нет). В таком порядке имя
 * `amostk.amostk.k-gif.gif` читается как метка `amostk`, а не как имя без метки. Дальше сегмента 1 маркера не
 * бывает: точки из метки вычищены.
 */
const MARKER_POSITIONS = [1, 0];

const MAX_LABEL_GRAPHEMES = 32;

/**
 * Потолок в байтах сверх потолка в графемах: длина графемы не ограничена (комбинирующие знаки), а слишком длинное
 * имя сервер или браузер может урезать вместе с маркером. 128 байт вмещают 32 графемы кириллицы и 32 простых эмодзи.
 */
const MAX_LABEL_BYTES = 128;

/**
 * Точка и слеш ломают разбор имени по сегментам и путь при скачивании, управляющие символы (перевод строки) ломают
 * скачивание, bidi-символы подменяют видимое имя скачанного файла. Весь `\p{Cf}` не вычищается: в нём ZWJ, без
 * которого составные эмодзи распадаются.
 */
const LABEL_JUNK = /[./\p{Cc}\u202A-\u202E\u2066-\u2069]/gu;

/**
 * Режем по графемам, а не по UTF-16 единицам или кодпоинтам: первое разрывает суррогатную пару, второе — ZWJ-эмодзи
 * и флаги.
 */
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

const UTF8 = new TextEncoder();

/**
 * Метка для имени файла: без символов, ломающих имя, не длиннее 32 графем и 128 байт UTF-8, без пробелов по краям.
 * Графема не разрезается: не влезает целиком — метка на ней заканчивается.
 *
 * @param raw — эмодзи, подпись или название GIF как есть
 * @returns метка; пустая строка — метки нет, имя начинается с маркера
 */
export const sanitizeLabel = (raw: string): string => {
  const cleaned = raw.replaceAll(LABEL_JUNK, '').trim();
  let label = '';
  let count = 0;
  let bytes = 0;

  for (const { segment } of GRAPHEME_SEGMENTER.segment(cleaned)) {
    const segmentBytes = UTF8.encode(segment).length;

    if (count === MAX_LABEL_GRAPHEMES || bytes + segmentBytes > MAX_LABEL_BYTES) {
      break;
    }

    label += segment;
    count += 1;
    bytes += segmentBytes;
  }

  /**
   * Обрезка могла оставить пробел в конце — он встал бы перед маркером (`Привет .amostk.…`).
   */
  return label.trim();
};

/**
 * Имя файла для отправки. Параметры приходят только из констант кода, поэтому невалидный параметр — ошибка
 * программиста, а не пользовательский ввод.
 *
 * @param fileName — вид, метка как есть и необязательные параметры
 * @returns имя `[метка.]amostk.k-<вид>[.<ключ>-<значение>]*.gif`; пустая после вычистки метка не пишется
 * @throws {Error} ключ или значение параметра не из `[a-z0-9]`, ключ не с буквы или равен `k`
 */
export const buildStickerFileName = ({
  kind,
  label,
  params,
}: StickerFileNameParams): string => {
  const paramSegments = Object.entries(params || {}).map(([key, value]) => {
    if (key === KIND_KEY || !PARAM_KEY.test(key) || !PARAM_VALUE.test(value)) {
      throw new Error(`Невалидный параметр имени файла: «${key}» = «${value}»`);
    }

    return `${key}-${value}`;
  });
  const cleanLabel = sanitizeLabel(label);
  const labelSegments = cleanLabel ? [cleanLabel] : [];

  return [
    ...labelSegments,
    MARKER,
    `${KIND_KEY}-${kind}`,
    ...paramSegments,
    EXTENSION,
  ].join('.');
};

/**
 * Вид по значению `k`. Незнакомое значение — не повод считать имя чужим: будущий вид остаётся именем amo stickers.
 *
 * @param value — значение параметра `k`, если он есть
 * @returns вид или null
 */
const toKind = (value: string | undefined): StickerFileKind | null => {
  switch (value) {
    case 'sticker': {
      return 'sticker';
    }

    case 'gif': {
      return 'gif';
    }

    default: {
      return null;
    }
  }
};

/**
 * Параметры из сегментов между маркером и расширением. Сегмент не в форме `ключ-значение` пропускается — будущие
 * версии формата могут добавить сегменты иного вида; при повторе ключа действует первое вхождение.
 *
 * @param segments — сегменты после маркера без расширения
 * @returns все параметры, включая `k`
 */
const parseParams = (segments: string[]): Record<string, string> => {
  return segments.reduce<Record<string, string>>((acc, segment) => {
    const dashIndex = segment.indexOf('-');
    const key = segment.slice(0, dashIndex);
    const value = segment.slice(dashIndex + 1);

    if (
      dashIndex > 0 &&
      PARAM_KEY.test(key) &&
      PARAM_VALUE.test(value) &&
      !Object.hasOwn(acc, key)
    ) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

/**
 * Разбор имени файла amo stickers. Незнакомый вид, незнакомые параметры и сегменты иного вида имя чужим не делают.
 *
 * @param name — имя файла
 * @returns вид, метка и параметры без `k`; null — нет маркера на месте или расширения
 */
export const parseStickerFileName = (name: string): ParsedStickerFileName | null => {
  const segments = name.split('.');
  const extension = segments.at(-1) || '';

  if (segments.length < MIN_SEGMENTS || !EXTENSION_SEGMENT.test(extension)) {
    return null;
  }

  const markerIndex = MARKER_POSITIONS.find((index) => {
    return segments[index] === MARKER;
  });

  if (markerIndex === undefined) {
    return null;
  }

  const { [KIND_KEY]: kindValue, ...params } = parseParams(
    segments.slice(markerIndex + 1, -1)
  );

  return {
    kind: toKind(kindValue),
    label: markerIndex === 1 ? segments[0] || '' : '',
    params,
  };
};

/**
 * Имя файла для отправки элемента пикера. Вид берётся из элемента, а не из записи: у «Недавних» GIF из поиска
 * остаётся `gif`, какие бы данные ни пришли рядом.
 *
 * @param item — что отправляется: стикер из пака или GIF из поиска
 * @param sticker — запись стикера для `local`: метка — подпись, без неё — эмодзи; для `remote` не читается
 * @returns имя файла; нет метки — имя начинается с маркера
 */
export const sendFileName = (item: SendItem, sticker?: StickerLabelSource): string => {
  switch (item.kind) {
    case 'local': {
      return buildStickerFileName({
        kind: 'sticker',
        label: sticker?.caption || sticker?.emoji || '',
      });
    }

    case 'remote': {
      return buildStickerFileName({ kind: 'gif', label: item.gif.title || '' });
    }

    default: {
      const unknownItem: never = item;

      throw new Error(`Unknown send item: ${JSON.stringify(unknownItem)}`);
    }
  }
};
