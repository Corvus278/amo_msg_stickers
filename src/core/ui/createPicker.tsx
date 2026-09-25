import { render } from 'preact';

import css from './picker.css';

import type { Host } from '../host.types';

import { Picker } from './Picker/Picker';
import { PickerProvider } from './Picker/PickerProvider/PickerProvider';
import type { PickerCallbacks, PickerHandle } from './createPicker.types';

/**
 * Пикер в shadow root за императивным фасадом: `app.ts` живёт в DOM amo без Preact и
 * управляет попапом вызовами методов.
 *
 * Дерево перерисовывается `render()` на каждое изменение `isOpen`/`isDark`: закрытый
 * пикер остаётся смонтированным, поэтому состояние компонентов (вкладка, запрос поиска)
 * переживает повторное открытие.
 *
 * @param env — окружение: сеть и настройки
 * @param callbacks — отправка стикера и реакция на закрытие
 * @returns управление пикером
 */
export const createPicker = (env: Host, callbacks: PickerCallbacks): PickerHandle => {
  const { onSend, onClose } = callbacks;
  const element = document.createElement('div');

  element.setAttribute('data-amo-stickers-picker', '');
  const shadowRoot = element.attachShadow({ mode: 'open' });

  let isOpen = false;
  let isDark = false;

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    update();
    onClose();
  };

  /**
   * `<style>` рендерится в том же дереве, а не вставляется в shadow root заранее:
   * первый `render()` Preact удаляет из контейнера узлы, которых нет в дереве.
   */
  const update = () => {
    render(
      <>
        <style>{css}</style>

        <PickerProvider env={env} onSend={onSend} onClose={close} isOpen={isOpen}>
          <Picker isOpen={isOpen} isDark={isDark} onClose={close} />
        </PickerProvider>
      </>,
      shadowRoot
    );
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    update();
  };

  const setTheme = (nextIsDark: boolean) => {
    if (nextIsDark === isDark) return;
    isDark = nextIsDark;
    update();
  };

  update();

  return {
    element,
    get isOpen() {
      return isOpen;
    },
    open,
    close,
    setTheme,
  };
};
