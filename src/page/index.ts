import { startAgent } from './agent';

/**
 * Точка входа агента в мире страницы: у расширения — content script с `"world": "MAIN"`, у
 * userscript — строка `page-agent:code`, вставленная элементом `<script>`.
 */
startAgent(document, window);
