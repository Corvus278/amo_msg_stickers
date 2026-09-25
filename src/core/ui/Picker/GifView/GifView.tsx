import type { FunctionComponent as FC } from 'preact';

/**
 * Заглушка представления: содержимое пишет своя группа прогона, а представление уже
 * владеет своим скролл-контейнером в теле панели. `data-view` — метка для проверки
 * переключения на стенде.
 */
export const GifView: FC = () => {
  return <div className="min-h-0 flex-1 overflow-y-auto" data-view="gifs" />;
};
