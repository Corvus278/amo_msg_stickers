import { describe, expect, it, vi } from 'vitest';

import { finishImport } from '../src/core/ui/Picker/PickerProvider/finishImport/finishImport';

const PACK = { id: 'tg:cats', title: 'Коты' };

/**
 * Колбэки провайдера с общим журналом вызовов: порядок перехода и статуса важен.
 *
 * @returns колбэки и журнал
 */
const callbacks = () => {
  const calls: string[] = [];
  const scrollToSection = vi.fn((sectionId: string) => {
    calls.push(`scroll ${sectionId}`);
  });
  const showStatus = vi.fn((text: string) => {
    calls.push(`status ${text}`);
  });

  return { calls, scrollToSection, showStatus };
};

describe('finishImport', () => {
  it('экран «Добавить» открыт — переход к паку, затем статус', () => {
    const { calls, scrollToSection, showStatus } = callbacks();

    finishImport({ screen: 'add', pack: PACK, scrollToSection, showStatus });

    expect(calls).toEqual(['scroll tg:cats', 'status Пак «Коты» добавлен']);
  });

  it('экран «Добавить» закрыт — только статус, лента не двигается', () => {
    const { calls, scrollToSection, showStatus } = callbacks();

    finishImport({ screen: null, pack: PACK, scrollToSection, showStatus });

    expect(scrollToSection).not.toHaveBeenCalled();
    expect(calls).toEqual(['status Пак «Коты» добавлен']);
  });

  it('открыт другой экран — только статус', () => {
    const { scrollToSection, showStatus } = callbacks();

    finishImport({ screen: 'settings', pack: PACK, scrollToSection, showStatus });

    expect(scrollToSection).not.toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledTimes(1);
  });
});
