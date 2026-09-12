// @repo/app-core — level 2.
// Shared by useFormattingLocale.ts and the two provider composers: turns the stored
// LanguagePreference ('system' or an explicit shipped language) into the Language i18next and
// Intl should actually use right now.

import type { Language } from '@repo/i18n/languages';
import { resolveLanguage } from '@repo/i18n/languages';
import type { LanguagePreference } from '../stores/createPreferencesStore';

export function resolveActiveLanguage(preference: LanguagePreference, systemLocale: string): Language {
  return preference === 'system' ? resolveLanguage(systemLocale) : preference;
}
