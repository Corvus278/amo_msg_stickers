---
paths:
  - "/**/*.tsx"
  - "/**/*.jsx"
---

# React (Preact)

UI пишется на Preact; правила сформулированы в терминах React и действуют без изменений.

1. Не передавай стрелочные функции напрямую в `on`-пропсы (объявляй хендлеры).
2. Не передавай методы напрямую в `on`-колбэки — создавай хендлеры.
3. Из хуков возвращай методы, а не хендлеры.
4. В пропсы передавай только колбэки (никаких set-методов).
5. Избегай `useMemo` для мелких вычислений.
6. Для фильтрации — `useMemo`, а не set в `useEffect`.
7. Деструктуризация пропсов/опций — первой строкой в теле функции.
8. Логику (хуки) выноси в отдельные файлы, не храни в компонентах.
9. Между JSX одного уровня вложенности — пустые строки.
10. В `useState` используй `null`, а не пустой объект.
11. Для compound-компонентов используй слоты, композицию, контекст — вместо флагов и props drilling.
12. Хендлеры именуй по схеме `handle{Объект}{Событие}` (`handleConfirmClick`, `handleCancelClick`,
    `handleSearchInput`). *(см. ниже)*
13. Классы по варианту или состоянию — через `cva` (`class-variance-authority`), не `switch`, тернарником или
    условной склейкой. *(см. ниже)*

## Практики React

- делай гранулярные ui-компоненты
- заводи отдельный `ContextProvider`, оборачивающий `children` *(см. ниже)*
- колбэки в опциях/пропсах можно передавать (`onSave`, `onCancel`, `onEdit`)
- методы в опциях/пропсах передавать нельзя (`save`, `cancel`, `edit`)
- хуки и контексты возвращают чистые методы (`save`, `cancel`, `switch`, `change`), не хендлеры и не `on`-колбэки
- хендлеры объявляй внутри ui-компонентов для обработки действий пользователя; они вызывают `on`-колбэки и методы, но не
  другие хендлеры
- минимизируй число пропсов
- связанные файлы компонента (хуки, типы, стили) — в его директории
- имя файла совпадает с именем директории: `Select/Select.tsx`

---

## Подробности

### #12. Именование хендлеров — `handle{Объект}{Событие}`

**Why:** одного `handleClick` мало, когда в компоненте несколько кликабельных элементов — непонятно, к чему он. Связка
объект + событие читается сразу: `handleConfirmClick` — клик по «Подтвердить», `handleCancelClick` — по «Отмена».
Событие в конце совпадает с DOM-событием, на которое навешан хендлер (`Click`, `Input`, `Change`, `KeyDown`).

**Хорошо:**

```tsx
const handleConfirmClick = () => onConfirm(value);
const handleCancelClick = () => dismiss();
const handleSearchInput = (event: Event) => search(event.currentTarget.value);
```

**Плохо** (теряется объект — какой именно клик?):

```tsx
const handleConfirm = () => onConfirm(value);
const handleCancel = () => dismiss();
const handleClick = () => {};
```

---

### #13. Варианты классов — через `cva`

**Why:** `cva` держит все варианты компонента в одной декларации: видно, какие классы у какого значения, тип пропа
выводится из неё же (`VariantProps`), а новое значение варианта — одна строка вместо ветки `switch`.

**Когда применять:** классы выбираются по пропу, состоянию или флагу — вид кнопки, «занято», «перетаскивают файл».
Несколько независимых осей — отдельные ключи `variants`; сочетание осей — `compoundVariants`; вид по умолчанию —
`defaultVariants`. Декларация — `camelCase` с суффиксом `Variants` и живёт в `.tsx` компонента: Tailwind ищет классы
только в `src/core/ui/**/*.tsx`, и классы из `.ts` в CSS пикера не попадут. Тип пропа в `*.types.ts` берётся из неё
через `VariantProps` (`import type` из файла компонента).

**Когда не применять:** состояние, которое уже выражено вариантом Tailwind по атрибуту или предку (`aria-selected:`,
`aria-pressed:`, `disabled:`, `group-hover:`, `dark:`), — это не условный класс, он остаётся в строке классов.
Склейка без вариантов — `cx` из `class-variance-authority`, отдельный `clsx` не ставим. `tailwind-merge` не берём:
конфликтующих утилит на одном элементе нет, а токены amo ломают merge без отдельного конфига.

**Хорошо:**

```tsx
export const buttonVariants = cva('shrink-0 rounded-lg disabled:opacity-50', {
  variants: {
    variant: {
      primary: 'h-8 px-3.5 bg-blue-50 text-white-0',
      danger: 'h-5.5 px-1.5 bg-transparent text-red-30',
    },
  },
});

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

<button className={buttonVariants({ variant })} />
```

**Плохо:**

```tsx
const getVariantClass = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return 'h-8 px-3.5 bg-blue-50 text-white-0';
    // …
  }
};

<div className={cx('group relative', isBusy && 'pointer-events-none opacity-40')} />
```

---

### `ContextProvider`, оборачивающий `children`

**Why:** провайдер изолирует состояние фичи. Потребители не знают, как оно собрано; легко мокать в тестах; при ошибке
использования вне провайдера сразу падает с понятным сообщением.
