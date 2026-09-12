// @repo/i18n — level 1.
// i18next initialization — a factory, never a module singleton: test isolation and desktop
// multi-window each need their own instance, the same reasoning createPreferencesStore.ts gives
// for its own factory. The React binding of this instance belongs to @repo/app-core (§5).

import { createInstance, type i18n } from 'i18next';
import { DEFAULT_LANGUAGE, type Language } from './languages';
import { DEFAULT_NAMESPACE, NAMESPACES, resources } from './resources';

/** Builds a ready-to-use i18next instance for `language`. Resources are bundled at build time, so
 * `init()` resolves synchronously — nothing here ever awaits a network fetch. */
export function createI18n(language: Language): i18n {
  const instance = createInstance();
  void instance.init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    resources,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: { escapeValue: false }, // React already escapes — double-escaping breaks apostrophes.
    returnNull: false,
  });
  return instance;
}
