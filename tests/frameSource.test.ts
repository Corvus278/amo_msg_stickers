import { describe, expect, it, vi } from 'vitest';

import { openFrameSource } from '../src/core/frameSource';
import { openImageSource } from '../src/core/frameSourceImage';
import { openTgsSource } from '../src/core/frameSourceTgs';
import { openVideoSource } from '../src/core/frameSourceVideo';

vi.mock('../src/core/frameSourceVideo', () => {
  return { openVideoSource: vi.fn() };
});

vi.mock('../src/core/frameSourceTgs', () => {
  return { openTgsSource: vi.fn() };
});

vi.mock('../src/core/frameSourceImage', () => {
  return { openImageSource: vi.fn() };
});

describe('openFrameSource', () => {
  it.each([
    ['video', openVideoSource],
    ['tgs', openTgsSource],
    ['image', openImageSource],
  ] as const)('%s → свой источник с тем же blob и maxSide', async (kind, open) => {
    const blob = new Blob();

    await openFrameSource(blob, kind, 384);
    expect(open).toHaveBeenCalledWith(blob, 384);
  });
});
