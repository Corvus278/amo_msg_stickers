/**
 * Userscript работает в изолированном мире, а внутренний путь отправки amo виден только
 * скриптам страницы. DOM у миров общий, поэтому агент попадает в мир страницы элементом
 * `<script>` с его кодом: браузер выполняет такой элемент в мире страницы у любого
 * менеджера и без менеджера. Элемент удаляется сразу — код уже выполнен, а в разметке amo
 * лишний узел не нужен.
 *
 * Сейчас у amo нет CSP; если появится `script-src` без `unsafe-inline`, код не выполнится,
 * и отправка пойдёт запасным путём, вставкой в поле ввода.
 *
 * @param doc — документ страницы
 * @param code — код агента (`PAGE_AGENT_CODE`)
 */
export const injectPageAgent = (doc: Document, code: string) => {
  const script = doc.createElement('script');

  script.textContent = code;
  (doc.head || doc.documentElement).append(script);
  script.remove();
};
