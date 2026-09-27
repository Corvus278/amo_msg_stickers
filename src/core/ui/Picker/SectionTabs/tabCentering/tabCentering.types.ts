export type TabCenteringOptions = {
  /**
   * Ставит выбранную вкладку по центру полосы с заданным движением.
   *
   * @returns поставлена ли вкладка: `false` — полоса скрыта или выбранной вкладки нет
   */
  place: (behavior: ScrollBehavior) => boolean;

  /**
   * Движение, которое разрешает системная настройка: `'auto'` — мгновенно.
   */
  motion: () => ScrollBehavior;
};

export type TabCentering = {
  /**
   * Выбрана другая вкладка.
   */
  select: () => void;

  /**
   * Полоса сменила ширину; `0` — полоса скрыта.
   */
  resize: (width: number) => void;
};
