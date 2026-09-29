/**
 * Минимальный fiber React для тестов поиска провайдера: только поля, по которым идёт поиск.
 */
export type FakeFiber = {
  /**
   * Родительский fiber.
   */
  return: FakeFiber | null;

  /**
   * Вторая копия fiber (current / work-in-progress).
   */
  alternate: FakeFiber | null;

  /**
   * Пропсы узла; у провайдера контекста — `value`.
   */
  memoizedProps: Record<string, unknown> | null;
};

/**
 * Цепочка fiber от листа к корню длиной `depth + 1`; у узла на глубине `depth` — пропсы
 * `props`.
 *
 * @param depth — глубина узла с пропсами от листа
 * @param props — пропсы этого узла
 * @returns лист цепочки и узел на глубине `depth`
 */
export const fiberChain = (depth: number, props: Record<string, unknown>) => {
  const root: FakeFiber = { return: null, alternate: null, memoizedProps: props };
  let leaf = root;

  for (let index = 0; index < depth; index++) {
    leaf = { return: leaf, alternate: null, memoizedProps: {} };
  }

  return { leaf, target: root };
};

/**
 * DOM-узел, как его видит код страницы: fiber лежит под ключом `__reactFiber$<хэш>`.
 *
 * @param fiber — fiber узла
 * @returns объект-узел с ключом fiber
 */
export const nodeWithFiber = (fiber: FakeFiber) => {
  return { className: 'editable', __reactFiber$k3x9: fiber };
};
