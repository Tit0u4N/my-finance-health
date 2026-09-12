import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { accentTokens, categoricalPalette, colorTokens } from '@repo/design-tokens/colors';
import { breakpointTokens } from '@repo/design-tokens/layout';
import { durationTokens, easingTokens } from '@repo/design-tokens/motion';
import { radiusTokens } from '@repo/design-tokens/radii';
import { shadowTokens } from '@repo/design-tokens/shadows';
import { spacingTokens } from '@repo/design-tokens/spacing';
import { fontFamilyTokens, fontWeightTokens, textStyleTokens } from '@repo/design-tokens/typography';
import { describe, expect, it } from 'vitest';

const themeCss = readFileSync(join(import.meta.dirname, 'theme.css'), 'utf8');

const toKebabCase = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const readBlock = (selector: string): string => {
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(themeCss);

  if (block === null || block[1] === undefined) {
    throw new Error(`Block "${selector}" is missing from theme.css`);
  }

  return block[1];
};

const expectDeclarations = (block: string, prefix: string, tokens: Record<string, string | number>): void => {
  for (const [name, value] of Object.entries(tokens)) {
    expect(block).toContain(`--mfh-${prefix}${toKebabCase(name)}: ${value};`);
  }
};

describe('theme.css', () => {
  it('declares every light colour role with its token value', () => {
    expectDeclarations(readBlock(':root'), '', colorTokens.light);
  });

  it('declares every dark colour role with its token value', () => {
    expectDeclarations(readBlock('\\.dark'), '', colorTokens.dark);
  });

  it('declares the fixed accent tokens once, in :root', () => {
    expectDeclarations(readBlock(':root'), '', accentTokens);
  });

  it('declares the categorical palette in :root, 1-indexed', () => {
    const root = readBlock(':root');
    categoricalPalette.forEach((value, index) => {
      expect(root).toContain(`--mfh-categorical-${index + 1}: ${value};`);
    });
  });

  it('declares every scale token with its token value', () => {
    const root = readBlock(':root');

    expectDeclarations(root, 'spacing-', spacingTokens);
    expectDeclarations(root, 'radius-', radiusTokens);
    expectDeclarations(root, 'font-', fontFamilyTokens);
    expectDeclarations(root, 'duration-', durationTokens);
    expectDeclarations(root, 'ease-', easingTokens);
    expectDeclarations(root, 'shadow-', shadowTokens);
    expectDeclarations(root, 'font-weight-', fontWeightTokens);
  });

  it('declares every named text style as size/weight/tracking triples', () => {
    const root = readBlock(':root');
    for (const [name, style] of Object.entries(textStyleTokens)) {
      const prefix = `--mfh-text-${toKebabCase(name)}`;
      expect(root).toContain(`${prefix}-size: ${style.fontSize};`);
      expect(root).toContain(`${prefix}-weight: ${style.fontWeight};`);
      expect(root).toContain(`${prefix}-tracking: ${style.letterSpacing};`);
    }
  });

  it('exposes the colour tokens to Tailwind through @theme inline', () => {
    const theme = readBlock('@theme inline');

    for (const name of Object.keys(colorTokens.light)) {
      expect(theme).toContain(`--color-${toKebabCase(name)}: var(--mfh-${toKebabCase(name)});`);
    }
    for (const name of Object.keys(accentTokens)) {
      expect(theme).toContain(`--color-${toKebabCase(name)}: var(--mfh-${toKebabCase(name)});`);
    }
    categoricalPalette.forEach((_value, index) => {
      expect(theme).toContain(`--color-categorical-${index + 1}: var(--mfh-categorical-${index + 1});`);
    });
  });

  it('exposes the two custom breakpoints as literal values, not var()-indirected', () => {
    const theme = readBlock('@theme inline');
    expect(theme).toContain(`--breakpoint-half: ${breakpointTokens.half};`);
    expect(theme).toContain(`--breakpoint-panel: ${breakpointTokens.panel};`);
  });

  // Not readBlock('@layer components') — its ([^}]*) capture stops at the sheet's first "}",
  // which lands inside .text-caption, long before these recipes. Matched against the whole
  // sheet instead.
  it('declares the three layout recipes Accounts and Settings need', () => {
    expect(themeCss).toContain('.grid-cards {');
    expect(themeCss).toContain('.grid-half {');
    expect(themeCss).toContain('.grid-settings {');
  });

  it('collapses .grid-half and .grid-settings at the --breakpoint-half value, not a re-typed literal', () => {
    const halfPx = Number.parseInt(breakpointTokens.half, 10);
    expect(themeCss).toContain(`@media (width < ${halfPx}px) {`);
  });
});
