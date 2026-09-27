export type PackMenuButtonProps = {
  /**
   * Название пака — для подписи кнопки и меню.
   */
  title: string;

  /**
   * Колбэк на подтверждённое удаление пака.
   */
  onDelete: () => void;
};
