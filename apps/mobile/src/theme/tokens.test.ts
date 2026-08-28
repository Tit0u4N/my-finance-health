import { describe, expect, it } from '@jest/globals';
import { colorTokens } from '@repo/design-tokens/colors';
import { spacingTokens } from '@repo/design-tokens/spacing';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from './tokens';

// The DOM side has `theme.test.ts` in @repo/ui for the same purpose: catch a token drifting away from its
// consumers. Here the risk is a rem or oklch value silently landing in a React Native style.
describe('native theme', () => {
  it('turns the rem spacing scale into density-independent pixels', () => {
    expect(SPACING).toEqual({
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 40,
      gutter: 20,
      section: 64,
    });
  });

  it('covers every spacing token exposed by the package', () => {
    expect(Object.keys(SPACING).sort()).toEqual(Object.keys(spacingTokens).sort());
  });

  it('keeps the pixel radius as declared, without a unit', () => {
    expect(BORDER_RADIUS.md).toBe(10);
    expect(BORDER_RADIUS.full).toBe(9999);
  });

  it('scales the typographic ramp from the same root size', () => {
    expect(FONT_SIZE.base).toBe(16);
    expect(FONT_SIZE.display).toBe(44);
  });

  it('exposes both schemes as hexadecimal colours React Native can parse', () => {
    for (const scheme of ['light', 'dark'] as const) {
      expect(Object.keys(COLORS[scheme]).sort()).toEqual(Object.keys(colorTokens[scheme]).sort());

      for (const value of Object.values(COLORS[scheme])) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
