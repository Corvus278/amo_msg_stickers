import type { PickerMode } from '../../../pickerMode.types';

/**
 * Представление с прокручиваемым телом: из него берутся метки тела `data-view` и id вкладок
 * полосы разделов.
 */
export type View =
  | {
      /**
       * Представление без параметров: недавние, поиск GIF, добавление пака, настройки.
       */
      kind: 'recent' | 'gifs' | 'add' | 'settings';
    }
  | {
      /**
       * Представление пака стикеров.
       */
      kind: 'pack';

      /**
       * Открытый пак.
       */
      packId: string;
    };

/**
 * Экран поверх режима.
 */
export type PickerScreen = 'add' | 'settings';

/**
 * Запрос прокрутки ленты стикеров к разделу.
 */
export type SectionAnchor = {
  /**
   * Раздел: id пака (`custom`, `tg:<имя>`) или `recent` — недавние стикеры.
   */
  sectionId: string;

  /**
   * Номер запроса, растёт на каждый: повторный запрос того же раздела снова прокручивает к
   * нему.
   */
  seq: number;
};

export type PickerViewValue = {
  /**
   * Режим попапа, выбранный нижним переключателем.
   */
  mode: PickerMode;

  /**
   * Открытый экран поверх режима; `null` — экрана нет.
   */
  screen: PickerScreen | null;

  /**
   * Последний запрос прокрутки ленты стикеров; `null` — запросов не было.
   */
  anchor: SectionAnchor | null;

  /**
   * Переключает режим, закрывает экран и сохраняет режим для следующих открытий.
   */
  setMode: (mode: PickerMode) => void;

  /**
   * Открывает экран поверх режима.
   */
  openScreen: (screen: PickerScreen) => void;

  /**
   * Закрывает экран: под ним тот же режим с той же прокруткой.
   */
  closeScreen: () => void;

  /**
   * Открывает режим «Стикеры» без экрана и прокручивает ленту к разделу.
   */
  scrollToSection: (sectionId: string) => void;
};
