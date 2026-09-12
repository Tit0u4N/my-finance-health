import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, resolveFormattingLocale, resolveLanguage, SUPPORTED_LANGUAGES } from './languages';

describe('resolveLanguage', () => {
  it('matches a supported language on its primary subtag', () => {
    expect(resolveLanguage('fr-FR')).toBe('fr');
    expect(resolveLanguage('fr-CA')).toBe('fr');
    expect(resolveLanguage('en-GB')).toBe('en');
  });

  it('falls back to the default language for an unsupported locale', () => {
    expect(resolveLanguage('de-DE')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('ja-JP')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('')).toBe(DEFAULT_LANGUAGE);
  });

  it('is case-insensitive on the primary subtag', () => {
    expect(resolveLanguage('FR-fr')).toBe('fr');
  });
});

describe('resolveFormattingLocale', () => {
  it('keeps the host locale when it already speaks the chosen language', () => {
    expect(resolveFormattingLocale('en', 'en-GB')).toBe('en-GB');
    expect(resolveFormattingLocale('fr', 'fr-CA')).toBe('fr-CA');
  });

  it("falls back to the language's canonical locale when the host speaks a different one", () => {
    expect(resolveFormattingLocale('fr', 'en-GB')).toBe('fr-FR');
    expect(resolveFormattingLocale('en', 'de-DE')).toBe('en-US');
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('includes the default language', () => {
    expect(SUPPORTED_LANGUAGES).toContain(DEFAULT_LANGUAGE);
  });
});
