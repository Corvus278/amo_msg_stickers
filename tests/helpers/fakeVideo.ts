/**
 * Подставной `<video>` для тестов источника кадров в окружении `node`: события
 * `loadeddata` и `error` тест шлёт сам, `seeked` приходит микрозадачей после смены
 * `currentTime`, как у браузера — асинхронно.
 */
export class FakeVideo extends EventTarget {
  muted = false;

  playsInline = false;

  preload = '';

  src = '';

  duration = Number.NaN;

  videoWidth = 0;

  videoHeight = 0;

  /**
   * Сколько раз звали `load()`.
   */
  loads = 0;

  /**
   * Позиции всех seek-ов по порядку.
   */
  seeks: number[] = [];

  /**
   * Колбэк на seek: тест меняет в нём поля видео (например, `duration` после seek-а в конец).
   */
  onSeek: ((time: number) => void) | undefined;

  private time = 0;

  get currentTime() {
    return this.time;
  }

  set currentTime(time: number) {
    this.time = time;
    this.seeks.push(time);
    this.onSeek?.(time);
    queueMicrotask(() => {
      this.dispatchEvent(new Event('seeked'));
    });
  }

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  load() {
    this.loads += 1;
  }
}
