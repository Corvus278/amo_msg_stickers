import { CountingEventTarget } from './countingEventTarget';

/**
 * Узел с атрибутами — ровно то, что протокол агента читает у поля ввода и `<input>`.
 * Остальные свойства (fiber, `files`) задаются через `extra`.
 */
export class FakeElement {
  readonly attributes = new Map<string, string>();

  /**
   * Узел в документе: `remove()` снимает его, и поиск его больше не видит.
   */
  isConnected = true;

  constructor(extra: object = {}) {
    Object.assign(this, extra);
  }

  getAttribute(name: string) {
    const value = this.attributes.get(name);

    return value === undefined ? null : value;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  remove() {
    this.isConnected = false;
  }
}

const ATTR_PRESENCE_RE = /^\[([\w-]+)\]$/;

/**
 * `document` без DOM: события — через `CountingEventTarget` (видно, сняты ли слушатели),
 * `querySelectorAll` понимает только `[attr]` по узлам документа, `documentElement.append`
 * добавляет узел.
 */
export class FakeDocument extends CountingEventTarget {
  readonly elements: FakeElement[];

  readonly documentElement = {
    append: (element: FakeElement) => {
      this.elements.push(element);
    },
  };

  constructor(elements: FakeElement[] = []) {
    super();
    this.elements = [...elements];
  }

  querySelectorAll(selector: string) {
    const [, name = ''] = selector.match(ATTR_PRESENCE_RE) || [];

    return this.elements.filter((element) => {
      return element.isConnected && element.getAttribute(name) !== null;
    });
  }
}
