import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { colorTokens } from '@repo/design-tokens/colors';
import { durationTokens } from '@repo/design-tokens/motion';
import { radiusTokens } from '@repo/design-tokens/radii';
import { spacingTokens } from '@repo/design-tokens/spacing';
import { fontFamilyTokens, fontSizeTokens } from '@repo/design-tokens/typography';
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

const expectDeclarations = (block: string, prefix: string, tokens: Record<string, string>): void => {
  for (const [name, value] of Object.entries(tokens)) {
    expect(block).toContain(`--mfh-${prefix}${toKebabCase(name)}: ${value};`);
  }
};

describe('theme.css', () => {
  it('declares every light colour token with its token value', () => {
    expectDeclarations(readBlock(':root'), '', colorTokens.light);
  });

  it('declares every dark colour token with its token value', () => {
    expectDeclarations(readBlock('\\.dark'), '', colorTokens.dark);
  });

  it('declares every scale token with its token value', () => {
    const root = readBlock(':root');

    expectDeclarations(root, 'spacing-', spacingTokens);
    expectDeclarations(root, 'radius-', radiusTokens);
    expectDeclarations(root, 'font-', fontFamilyTokens);
    expectDeclarations(root, 'text-', fontSizeTokens);
    expectDeclarations(root, 'duration-', durationTokens);
  });

  it('exposes the colour tokens to Tailwind through @theme inline', () => {
    const theme = readBlock('@theme inline');

    for (const name of Object.keys(colorTokens.light)) {
      expect(theme).toContain(`--color-${toKebabCase(name)}: var(--mfh-${toKebabCase(name)});`);
    }
  });
});
