// @repo/platform-expo — level 1.
// Clock whose timezone comes from the device calendar settings (expo-localization), not from
// Hermes' Intl, which can disagree with the system on a manual timezone override.

import type { Clock } from '@repo/platform/services/clock';
import { getCalendars } from 'expo-localization';

const FALLBACK_TIMEZONE = 'UTC';

export function createExpoClock(): Clock {
  return {
    now: () => new Date().toISOString(),
    systemTimezone: () => getCalendars()[0]?.timeZone ?? FALLBACK_TIMEZONE,
  };
}
