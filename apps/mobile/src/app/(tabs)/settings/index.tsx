import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import type { SettingsSectionId } from '@/screens/settings/settingsSections';

const FALLBACK_VERSION = '0.0.0';

// Each settings sub-screen is its own static route file (preferences.tsx, categories.tsx,
// data.tsx, about.tsx), not a `[id].tsx` dynamic segment, so `typedRoutes` types each path as its
// own literal — a templated `/settings/${id}` string doesn't satisfy that union. An explicit
// switch keeps every push type-checked against the routes that actually exist.
function openSection(id: SettingsSectionId) {
  switch (id) {
    case 'preferences':
      router.push('/settings/preferences');
      return;
    case 'categories':
      router.push('/settings/categories');
      return;
    case 'data':
      router.push('/settings/data');
      return;
    case 'about':
      router.push('/settings/about');
      return;
    default:
      throw new Error(`unhandled settings section: ${id satisfies never}`);
  }
}

export default function SettingsRoute() {
  return <SettingsScreen onOpenSection={openSection} version={Constants.expoConfig?.version ?? FALLBACK_VERSION} />;
}
