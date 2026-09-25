import type { FunctionComponent as FC } from 'preact';

import type { PackViewProps } from './PackView.types';

/**
 * Заглушка представления: содержимое пишет своя группа прогона, а представление уже
 * владеет своим скролл-контейнером в теле панели. `data-view` — метка для проверки
 * переключения на стенде.
 */
export const PackView: FC<PackViewProps> = (props) => {
  const { packId } = props;

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto"
      data-view="pack"
      data-pack-id={packId}
    />
  );
};
