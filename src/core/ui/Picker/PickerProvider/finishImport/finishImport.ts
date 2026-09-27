import type { FinishImportOptions } from './finishImport.types';

/**
 * Итог импорта. Пользователь, который дождался импорта на экране «Добавить стикеры», попадает к
 * разделу пака в ленте. Ушедший с экрана за время импорта уже смотрит что-то своё — лента и режим
 * не двигаются, итог виден только в статусе.
 *
 * Статус — после перехода: `scrollToSection` сбрасывает статус прошлого действия.
 *
 * @param options — экран, пак и колбэки провайдера
 */
export const finishImport = (options: FinishImportOptions): void => {
  const { screen, pack, scrollToSection, showStatus } = options;

  if (screen === 'add') scrollToSection(pack.id);

  showStatus(`Пак «${pack.title}» добавлен`);
};
