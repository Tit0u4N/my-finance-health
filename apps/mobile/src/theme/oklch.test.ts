import { describe, expect, it } from 'vitest';
import { oklchToHex } from './oklch';

describe('oklchToHex', () => {
  it('maps the achromatic extremes to pure black and pure white', () => {
    expect(oklchToHex('oklch(0 0 0)')).toBe('#000000');
    expect(oklchToHex('oklch(1 0 0)')).toBe('#ffffff');
  });

  it('converts the light primary of the token palette', () => {
    expect(oklchToHex('oklch(0.58 0.16 250)')).toBe('#0d7dd4');
  });

  it('converts the dark background of the token palette', () => {
    expect(oklchToHex('oklch(0.18 0.02 260)')).toBe('#0c121a');
  });

  it('clips out-of-gamut chroma instead of emitting an invalid channel', () => {
    expect(oklchToHex('oklch(0.7 0.4 140)')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('rejects a token that is not expressed in oklch', () => {
    expect(() => oklchToHex('#ffffff')).toThrow('Unsupported colour token');
  });

  it('appends an alpha channel for the `oklch(L C H / A)` form', () => {
    expect(oklchToHex('oklch(1 0 0 / 0.5)')).toBe('#ffffff80');
    expect(oklchToHex('oklch(0 0 0 / 0)')).toBe('#00000000');
  });
});
