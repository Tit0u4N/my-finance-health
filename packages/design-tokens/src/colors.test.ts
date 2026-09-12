// @repo/design-tokens — level 0.
// Guards the one invariant `categoricalPaletteHex` exists for: it must stay index-aligned with
// `categoricalPalette` (same swatch, two encodings) and every entry must satisfy the
// `hexColorSchema` shape the records that consume it (Category.color, Account.color) require.

import { describe, expect, it } from 'vitest';
import { categoricalPalette, categoricalPaletteHex } from './colors';

describe('categoricalPaletteHex', () => {
  it('has the same length as the oklch palette it mirrors', () => {
    expect(categoricalPaletteHex.length).toBe(categoricalPalette.length);
  });

  it('is a 6-digit hex colour for every entry', () => {
    for (const value of categoricalPaletteHex) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
