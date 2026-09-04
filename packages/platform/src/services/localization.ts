// @repo/platform — level 0.
// System localization (start-roadmap.md §8), consumed as a default before the user picks a
// language explicitly. Not the translation layer itself — that is @repo/i18n, level 1.

export type LocalizationService = {
  /** The host's current locale (BCP 47, e.g. "en-US", "fr-FR"). */
  locale(): string;
};
