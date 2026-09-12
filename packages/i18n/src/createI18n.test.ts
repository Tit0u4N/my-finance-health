// @repo/i18n — level 1.
// Plural resolution itself is i18next's own well-tested behaviour; resources.test.ts's key-parity
// check is what guards that every language actually defines the `_one`/`_other` forms a key needs.
// This file only covers what createI18n is responsible for: building a working instance per
// language and falling back sanely when asked for one we don't ship.

import { describe, expect, it } from 'vitest';
import { createI18n } from './createI18n';

describe('createI18n', () => {
  it('resolves a known key in English', () => {
    const instance = createI18n('en');
    expect(instance.t('common:state.loading')).toBe('Loading…');
  });

  it('resolves the same key in French', () => {
    const instance = createI18n('fr');
    expect(instance.t('common:state.loading')).toBe('Chargement…');
  });

  it('falls back to English for a language it does not ship', () => {
    const instance = createI18n('de' as any); // deliberately outside the Language union, to exercise fallbackLng
    expect(instance.t('common:state.loading')).toBe('Loading…');
  });

  it('creates an independent instance per call', () => {
    const first = createI18n('en');
    const second = createI18n('fr');
    expect(first.language).toBe('en');
    expect(second.language).toBe('fr');
  });
});
