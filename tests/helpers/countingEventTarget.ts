/**
 * Ключ регистрации слушателя: у `EventTarget` слушатель одного типа в фазе захвата и в
 * фазе всплытия — две разные регистрации.
 *
 * @param type — имя события
 * @param isCapture — фаза захвата
 * @returns ключ регистрации
 */
const keyOf = (type: string, isCapture: boolean) => {
  return `${type}:${isCapture}`;
};

/**
 * Фаза захвата из опций `addEventListener` / `removeEventListener`: булево — старая форма
 * записи того же `capture`.
 *
 * @param options — опции вызова
 * @returns фаза захвата
 */
const captureOf = (options: EventListenerOptions | boolean | undefined) => {
  if (typeof options === 'boolean') return options;

  return Boolean(options?.capture);
};

/**
 * `EventTarget`, который знает, сколько слушателей на нём висит: в окружении `node` тест
 * иначе не видит, сняли ли их. Учитывает `addEventListener`, `removeEventListener` и снятие
 * по `signal`; повтор того же слушателя в той же фазе, как и у `EventTarget`, не
 * регистрируется второй раз.
 *
 * `once` не поддержан и бросает: слушатель снимается срабатыванием, и без отдельного учёта
 * счётчик врал бы.
 */
export class CountingEventTarget extends EventTarget {
  /**
   * Регистрации по ключу `keyOf`: слушатель → метка его текущей регистрации. Метка нужна,
   * чтобы `abort` сигнала снятой и заново добавленной регистрации не снял новую.
   */
  private readonly registrations = new Map<
    string,
    Map<EventListenerOrEventListenerObject, object>
  >();

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ) {
    if (typeof options === 'object' && options.once) {
      throw new Error('CountingEventTarget не считает слушатели с once');
    }

    super.addEventListener(type, callback, options);

    const signal = typeof options === 'object' ? options.signal : undefined;

    if (!callback || signal?.aborted) return;

    const key = keyOf(type, captureOf(options));
    const listeners =
      this.registrations.get(key) ||
      new Map<EventListenerOrEventListenerObject, object>();

    if (listeners.has(callback)) return;

    const mark = {};

    listeners.set(callback, mark);
    this.registrations.set(key, listeners);
    signal?.addEventListener(
      'abort',
      () => {
        if (listeners.get(callback) === mark) listeners.delete(callback);
      },
      { once: true }
    );
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ) {
    super.removeEventListener(type, callback, options);

    if (!callback) return;

    this.registrations.get(keyOf(type, captureOf(options)))?.delete(callback);
  }

  /**
   * Сколько слушателей события висит на цели в обеих фазах.
   *
   * @param type — имя события
   * @returns число слушателей
   */
  listenerCount(type: string) {
    return (
      (this.registrations.get(keyOf(type, true))?.size || 0) +
      (this.registrations.get(keyOf(type, false))?.size || 0)
    );
  }
}
