import type { FunctionComponent as FC } from 'preact';

import type { ViewBodyProps } from './ViewBody.types';

/**
 * Прокручиваемое тело представления: занимает высоту между шапкой и строкой статуса.
 */
export const ViewBody: FC<ViewBodyProps> = (props) => {
  const { view, children, onScroll } = props;

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]"
      data-view={view.kind}
      data-pack-id={view.kind === 'pack' ? view.packId : undefined}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};
