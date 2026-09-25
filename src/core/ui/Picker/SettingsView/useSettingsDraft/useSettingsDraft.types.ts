import type { Settings } from '../../../../host.types';

export type SettingsDraft = {
  /**
   * Значения полей формы, ещё не сохранённые.
   */
  draft: Settings;

  /**
   * Меняет значение одного поля формы.
   */
  changeField: (key: keyof Settings, value: string) => void;

  /**
   * Сохраняет форму в хранилище окружения без пробелов по краям и показывает статус
   * «Сохранено»; новые ключи сразу доступны остальным вкладкам пикера.
   */
  save: () => Promise<void>;
};
