import type { FunctionComponent as FC } from 'preact';
import { render } from 'preact';
import { useLayoutEffect } from 'preact/hooks';

import type { PreviewPortalProps } from './PreviewPortal.types';

/**
 * Рисует детей в чужой корень отдельным деревом Preact. Свой портал вместо `createPortal` из
 * `preact/compat`: ради одного вызова слой совместимости в бандл не нужен.
 *
 * Дерево перерисовывается на каждый рендер портала и очищается при размонтировании.
 * Контекст панели во второе дерево не переходит, поэтому дети получают данные пропсами.
 */
export const PreviewPortal: FC<PreviewPortalProps> = (props) => {
  const { container, children } = props;

  useLayoutEffect(() => {
    render(children, container);
  });

  useLayoutEffect(() => {
    return () => {
      render(null, container);
    };
  }, [container]);

  return null;
};
