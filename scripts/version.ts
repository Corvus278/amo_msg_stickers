/**
 * Логика проверки версии для CI. Только стираемый синтаксис TS и без рантайм-импортов
 * (`import type` Node удаляет целиком): `scripts/check-version.mjs` импортирует модуль
 * напрямую, а Node снимает типы сам, без сборки.
 */

import type { Version, VersionSource } from './version.types';

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * `@version` из заголовка userscript. В `build.mjs` заголовок собран из строковых
 * литералов (`'// @version      0.3.0',`), поэтому строка не якорится к началу, а
 * значение обрывается на кавычке.
 */
const BANNER_VERSION_PATTERN = /\/\/\s*@version\s+([^\s'"`]+)/;

/**
 * Разбирает `MAJOR.MINOR.PATCH`. Пре-релизы и метки сборки не поддерживаются:
 * версия расширения Chrome их не допускает.
 *
 * @param value — строка версии
 * @returns компоненты версии числами
 * @throws {Error} строка не в формате `MAJOR.MINOR.PATCH`
 */
export const parseVersion = (value: string): Version => {
  const match = VERSION_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Версия «${value}» не в формате MAJOR.MINOR.PATCH`);
  }

  const [, major, minor, patch] = match;

  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};

/**
 * Сравнивает по числам, а не по строке: `0.10.0` выше `0.9.0`.
 *
 * @param left — первая версия
 * @param right — вторая версия
 * @returns положительное число, если `left` выше, отрицательное — если ниже, 0 — если равны
 */
export const compareVersions = (left: Version, right: Version): number => {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
};

/**
 * @param banner — текст с заголовком `==UserScript==`
 * @returns значение `@version` или `undefined`, если строки нет
 */
export const readBannerVersion = (banner: string): string | undefined => {
  return BANNER_VERSION_PATTERN.exec(banner)?.[1];
};

/**
 * @param sources — версии из всех мест, где она записана
 * @returns текст ошибки со всеми значениями и источниками; `undefined` — версии совпадают.
 * Пустой список — ошибка: сверять не с чем, и молчаливый успех спрятал бы поломку вызова.
 */
export const checkVersionConsistency = (sources: VersionSource[]): string | undefined => {
  if (sources.length === 0) {
    return 'Не заданы источники версии';
  }

  const listing = sources
    .map(({ source, version }) => {
      return `${source} — ${version || 'не найдена'}`;
    })
    .join(', ');
  const [first] = sources;
  const isConsistent = sources.every(({ version }) => {
    return Boolean(version) && version === first?.version;
  });

  if (isConsistent) {
    return undefined;
  }

  return `Версии расходятся: ${listing}`;
};

/**
 * @param current — версия ветки
 * @param base — версия базовой ветки (`master`)
 * @returns текст ошибки, если версия ветки не выше базы; `undefined` — версия поднята
 * @throws {Error} одна из версий не в формате `MAJOR.MINOR.PATCH`
 */
export const checkVersionGrowth = (current: string, base: string): string | undefined => {
  if (compareVersions(parseVersion(current), parseVersion(base)) > 0) {
    return undefined;
  }

  return `Версия ${current} не выше ${base} в базовой ветке — поднимите версию`;
};

/**
 * Аннотация ошибки GitHub Actions. Перевод строки обрывает workflow command, поэтому
 * `%`, `\r` и `\n` экранируются по её правилам — иначе в аннотацию попала бы только
 * первая строка многострочной ошибки (например, `git show` с причиной `fatal: …`).
 *
 * @param message — текст ошибки, возможно многострочный
 * @returns строка `::error::…` для вывода в лог
 */
export const toErrorAnnotation = (message: string): string => {
  const escaped = message
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');

  return `::error::${escaped}`;
};
