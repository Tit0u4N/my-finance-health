// ViewModel for SettingsScreen.tsx — the root menu (screens-invest-settings.jsx's
// `SettingsScreen`). `version` is injected by the route file rather than read here: like
// `expo-router`, `expo-constants` has not been approved for use inside a ViewModel in this pass
// (the onboarding precedent's reasoning is native-module registration on import breaking
// vitest-native — untested for expo-constants specifically, so the same caution applies until it
// is).

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useCategories } from '@repo/app-core/queries/useCategories';
import type { SettingsGroup } from './settingsSections';
import { buildSettingsGroups } from './settingsSections';

export type UseSettingsScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly title: string;
      readonly subtitle: string;
      readonly identitySubtitle: string;
      readonly hasEncryptedStorage: boolean;
      readonly encryptedBadgeLabel: string;
      readonly groups: readonly SettingsGroup[];
      readonly footer: string;
    };

export function useSettingsScreen(version: string): UseSettingsScreenResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const categoriesQuery = useCategories();

  if (categoriesQuery.data === undefined) {
    return { ready: false };
  }

  const groups = buildSettingsGroups({
    groupLabels: { app: t('settings:groups.app'), support: t('settings:groups.support') },
    rowLabels: {
      about: { label: t('settings:nav.about.label'), sub: t('settings:nav.about.sub') },
      categories: { label: t('settings:nav.categories.label'), sub: t('settings:nav.categories.sub') },
      data: { label: t('settings:nav.data.label'), sub: t('settings:nav.data.sub') },
      preferences: { label: t('settings:nav.preferences.label'), sub: t('settings:nav.preferences.sub') },
    },
  });

  return {
    encryptedBadgeLabel: t('settings:about.encryptedAtRest'),
    footer: t('settings:mobile.footer'),
    groups,
    // `hasEncryptedSqlDriver` is honestly false on mobile today (@repo/platform-expo is a
    // placeholder — apps/mobile/src/root/useAppRoot.ts) — the "Encrypted" badge follows the
    // capability instead of being hardcoded on, same rule as the Data screen's gate.
    hasEncryptedStorage: platform.capabilities.hasEncryptedSqlDriver,
    identitySubtitle: t('settings:identity.subtitle', { version }),
    ready: true,
    subtitle: t('settings:layout.subtitle'),
    title: t('settings:layout.title'),
  };
}
