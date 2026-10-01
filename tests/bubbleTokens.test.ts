import { describe, expect, it } from 'vitest';

import { BUBBLE_TOKENS } from '../src/core/bubbleTokens';
import { tailwindConfig } from '../tailwind.config';

const colorOf = (path: string): unknown => {
  const [group = '', shade = ''] = path.split('.');

  return Reflect.get(Reflect.get(tailwindConfig.theme.colors, group) || {}, shade);
};

describe('BUBBLE_TOKENS', () => {
  it.each(Object.entries(BUBBLE_TOKENS))(
    '%s совпадает с tailwind.config.ts',
    (path, hex) => {
      expect(String(colorOf(path)).toLowerCase()).toBe(hex);
    }
  );
});
