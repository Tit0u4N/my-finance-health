// Custom entry point, in place of the default `expo-router/entry`.
//
// Expo Go's Hermes build has `Intl.NumberFormat`/`Intl.DateTimeFormat` but not
// `Intl.RelativeTimeFormat` (no full-ICU), which `@repo/app-core`'s `formatRelativeDate`
// selector relies on (docs/spec/cross-app-pitfalls.md — same class of issue as #9, a runtime
// gap that only bites mobile). The RelativeTimeFormat polyfill itself calls `new
// Intl.PluralRules(...)` internally (formatjs docs: it does not bundle its own PluralRules),
// which the same Hermes build also lacks — so that polyfill has to land first. Both must run
// before ANY module reaches the selector, so they go first here rather than in
// `src/app/_layout.tsx`, which is already inside the route module graph. `expo-router/entry`
// is then required exactly as `main` used to point to it.
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/fr';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/locale-data/en';
import '@formatjs/intl-relativetimeformat/locale-data/fr';

import 'expo-router/entry';
