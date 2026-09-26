import { afterEach, describe, expect, it, vi } from 'vitest';

import { EVENT_TIMEOUT_MS, fit, waitForEvent } from '../src/core/frameSourceCommon';

import { CountingEventTarget } from './helpers/countingEventTarget';

/**
 * Сколько слушателей ожидания осталось на цели: и самого события, и `error`.
 *
 * @param target — цель ожидания
 * @param event — имя ожидаемого события
 * @returns общее число слушателей
 */
const listenerCount = (target: CountingEventTarget, event: string) => {
  return target.listenerCount(event) + target.listenerCount('error');
};

describe('waitForEvent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('разрешается по событию и снимает слушатели и таймер', async () => {
    vi.useFakeTimers();
    const target = new CountingEventTarget();
    const waiting = waitForEvent(target, 'loadeddata');

    target.dispatchEvent(new Event('loadeddata'));
    await expect(waiting).resolves.toBeUndefined();
    expect(listenerCount(target, 'loadeddata')).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('отклоняется по error сразу, не дожидаясь таймаута', async () => {
    vi.useFakeTimers();
    const target = new CountingEventTarget();
    const waiting = waitForEvent(target, 'loadeddata');

    target.dispatchEvent(new Event('error'));
    await expect(waiting).rejects.toThrow('loadeddata');
    expect(listenerCount(target, 'loadeddata')).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('отклоняется по таймауту и снимает слушатели', async () => {
    vi.useFakeTimers();
    const target = new CountingEventTarget();
    const waiting = waitForEvent(target, 'seeked');
    const assertion = expect(waiting).rejects.toThrow('timeout: seeked');

    vi.advanceTimersByTime(EVENT_TIMEOUT_MS);
    await assertion;
    expect(listenerCount(target, 'seeked')).toBe(0);
  });
});

describe('fit', () => {
  it('вписывает большую сторону в предел с сохранением пропорций', () => {
    expect(fit(2000, 1000, 512)).toEqual([512, 256]);
    expect(fit(1024, 780, 512)).toEqual([512, 390]);
  });

  it('мелкий источник не увеличивает', () => {
    expect(fit(300, 200, 512)).toEqual([300, 200]);
  });

  it('не даёт стороны меньше 1 px', () => {
    expect(fit(4000, 1, 512)).toEqual([512, 1]);
  });
});
