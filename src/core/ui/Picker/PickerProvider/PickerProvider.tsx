import type { FunctionComponent as FC } from 'preact';

import { PickerViewContext } from '../usePickerView/PickerViewContext';

import { PickerContext } from './PickerContext';
import type { PickerProviderProps } from './PickerProvider.types';
import { usePickerState } from './usePickerState';

export const PickerProvider: FC<PickerProviderProps> = (props) => {
  const { env, onSend, onClose, isOpen, children } = props;
  const { picker, view } = usePickerState({ env, onSend, onClose, isOpen });

  return (
    <PickerContext.Provider value={picker}>
      <PickerViewContext.Provider value={view}>{children}</PickerViewContext.Provider>
    </PickerContext.Provider>
  );
};
