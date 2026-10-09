// @repo/platform-expo — level 1.
// LocalizationService on the device's preferred language (expo-localization).

import type { LocalizationService } from '@repo/platform/services/localization';
import { getLocales } from 'expo-localization';

const FALLBACK_LOCALE = 'en-US';

export function createExpoLocalization(): LocalizationService {
  return {
    locale: () => getLocales()[0]?.languageTag ?? FALLBACK_LOCALE,
  };
}
