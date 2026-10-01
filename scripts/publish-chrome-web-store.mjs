/**
 * Публикация пакета релиза в Chrome Web Store: загрузка и отправка на проверку. Доступы — из переменных
 * окружения (секреты репозитория): `CWS_SERVICE_ACCOUNT_KEY` — JSON-ключ сервисного аккаунта, `CWS_PUBLISHER_ID` —
 * ID издателя; `CWS_ITEM_ID` — ID расширения. Без доступов публикация пропускается предупреждением и кодом 0:
 * релиз на GitHub от неё не зависит. Сбой — аннотация `::error::` и код 1.
 *
 * Запуск: `node scripts/publish-chrome-web-store.mjs <путь к zip>`.
 */
import { openAsBlob, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

import { publishToChromeWebStore } from './chromeWebStore.ts';
import { toErrorAnnotation } from './version.ts';

const {
  CWS_SERVICE_ACCOUNT_KEY: serviceAccountKey,
  CWS_PUBLISHER_ID: publisherId,
  CWS_ITEM_ID: itemId,
} = process.env;
const [zipPath] = process.argv.slice(2);

if (!zipPath || !itemId) {
  console.error(toErrorAnnotation('Нужны путь к zip аргументом и CWS_ITEM_ID'));
  process.exit(1);
}

if (!serviceAccountKey || !publisherId) {
  console.info(
    '::warning::Нет секрета CWS_SERVICE_ACCOUNT_KEY или CWS_PUBLISHER_ID — публикация в Chrome Web Store пропущена'
  );
  process.exit(0);
}

const { version } = JSON.parse(readFileSync('src/extension/manifest.json', 'utf8'));

try {
  const result = await publishToChromeWebStore({
    serviceAccountKey,
    publisherId,
    itemId,
    version,
    zip: await openAsBlob(zipPath),
    fetchFn: fetch,
    sleep,
    nowSeconds: Math.floor(Date.now() / 1000),
  });

  switch (result.outcome) {
    case 'already-in-store': {
      console.info(
        `::notice::Версия ${version} уже в Chrome Web Store (${result.state}) — повторно не загружается`
      );
      break;
    }

    case 'submitted': {
      console.info(
        `::notice::Версия ${version} отправлена в Chrome Web Store, состояние ${result.state}`
      );
      break;
    }

    default: {
      throw new Error(`Неизвестный исход публикации: ${JSON.stringify(result)}`);
    }
  }
} catch (error) {
  console.error(
    toErrorAnnotation(
      `Публикация в Chrome Web Store: ${error instanceof Error ? error.message : String(error)}`
    )
  );
  process.exitCode = 1;
}
