// @repo/platform-tauri — level 1.

import { describe, expect, it } from 'vitest';
import { createNavigatorLocalization } from './localization';

describe('createNavigatorLocalization', () => {
  it('reads locale from navigator.language', () => {
    const localization = createNavigatorLocalization({ language: 'fr-FR' });

    expect(localization.locale()).toBe('fr-FR');
  });
});
