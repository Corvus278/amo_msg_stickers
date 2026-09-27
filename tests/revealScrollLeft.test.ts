import { describe, expect, it } from 'vitest';

import { revealScrollLeft } from '../src/core/ui/Picker/SectionTabs/revealScrollLeft/revealScrollLeft';

const STRIP = { scrollLeft: 100, width: 200, inset: 0 };

describe('revealScrollLeft', () => {
  it('видимая целиком вкладка не двигает полосу', () => {
    expect(revealScrollLeft({ left: 120, width: 34 }, STRIP)).toBe(100);
    expect(revealScrollLeft({ left: 100, width: 34 }, STRIP)).toBe(100);
    expect(revealScrollLeft({ left: 266, width: 34 }, STRIP)).toBe(100);
  });

  it('вкладка левее видимой части встаёт к левому краю', () => {
    expect(revealScrollLeft({ left: 40, width: 34 }, STRIP)).toBe(40);
    expect(revealScrollLeft({ left: 80, width: 34 }, STRIP)).toBe(80);
  });

  it('вкладка правее видимой части встаёт к правому краю', () => {
    expect(revealScrollLeft({ left: 280, width: 34 }, STRIP)).toBe(114);
    expect(revealScrollLeft({ left: 500, width: 34 }, STRIP)).toBe(334);
  });

  it('отступ полосы у краёв остаётся видимым вместе с вкладкой', () => {
    const strip = { scrollLeft: 100, width: 200, inset: 6 };

    expect(revealScrollLeft({ left: 6, width: 34 }, strip)).toBe(0);
    expect(revealScrollLeft({ left: 80, width: 34 }, strip)).toBe(74);
    expect(revealScrollLeft({ left: 280, width: 34 }, strip)).toBe(120);
    expect(revealScrollLeft({ left: 106, width: 34 }, strip)).toBe(100);
  });
});
