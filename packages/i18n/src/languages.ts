// @repo/i18n — level 1.
// The supported UI languages and the two derivations the app needs from them: which resource
// catalogue to load, and which BCP 47 locale Intl should format numbers/dates with. Kept separate
// from createI18n.ts so @repo/app-core can resolve a language from the platform's system locale
// without constructing an i18next instance (start-roadmap.md §5).

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';

/** The regional locale each language falls back to when the host doesn't offer a more specific
 * one of its own — e.g. a host reporting "fr-CA" keeps fr-CA, but a host reporting "de-DE" that
 * has picked French explicitly falls back to this. */
const CANONICAL_LOCALE: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
};

function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function primarySubtag(locale: string): string {
  return locale.split('-')[0]?.toLowerCase() ?? '';
}

/** Narrows a host locale (e.g. "fr-FR", "en-GB", "de-DE") to a catalogue we actually ship —
 * matched on the primary subtag only. Anything unsupported resolves to English
 * (`platform.localization.locale()`'s docblock: "consumed as a default before the user picks a
 * language explicitly"). */
export function resolveLanguage(locale: string): Language {
  const subtag = primarySubtag(locale);
  return isSupportedLanguage(subtag) ? subtag : DEFAULT_LANGUAGE;
}

/** The locale Intl formatting (money, dates, percent) should use for a chosen language. Keeps the
 * host's own regional locale when it already speaks that language (an en-GB host that picks
 * English keeps en-GB formatting), and falls back to the language's canonical locale otherwise —
 * compares the raw primary subtag, not resolveLanguage()'s result, so a host in an unsupported
 * language (e.g. "de-DE") isn't mistaken for one that already speaks the requested language. */
export function resolveFormattingLocale(language: Language, systemLocale: string): string {
  return primarySubtag(systemLocale) === language ? systemLocale : CANONICAL_LOCALE[language];
}
