// @repo/app-core — level 2.
// Replaces a bare `platform.localization.locale()` call in a ViewModel: once the user can pick a
// UI language, Intl formatting (money, dates, percent) must follow that choice too, not just the
// host's system locale (app-core-inventory.md §6: "locale from i18n").

import { resolveFormattingLocale } from '@repo/i18n/languages';
import { usePlatform } from '../providers/usePlatform';
import { usePreferencesStore } from '../stores/PreferencesProvider';
import { resolveActiveLanguage } from './resolveActiveLanguage';

/** The BCP 47 locale every `formatMoney`/`formatAbsoluteDate`/`formatRelativeDate`/`formatPercent`
 * call should use — the chosen language's locale, or the host's own when the preference is
 * 'system'. */
export function useFormattingLocale(): string {
  const systemLocale = usePlatform().localization.locale();
  const language = usePreferencesStore((state) => state.language);
  return resolveFormattingLocale(resolveActiveLanguage(language, systemLocale), systemLocale);
}
