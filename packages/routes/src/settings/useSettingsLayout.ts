// @repo/routes — level 3.
// ViewModel for SettingsLayout.tsx — the 250px nav rail + content shell every /settings/* path
// mounts under (routes.md §1). No `ready` union: nothing here is async data.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePlatform } from '@repo/app-core/providers/usePlatform';
import { useRouterState } from '@tanstack/react-router';
import { Database, Info, SlidersHorizontal, Tag } from 'lucide-react';

export type SettingsNavId = 'preferences' | 'categories' | 'database' | 'about';

export type SettingsNavItem = {
  readonly id: SettingsNavId;
  readonly label: string;
  readonly sub: string;
  readonly icon: typeof SlidersHorizontal;
  readonly color: string;
  readonly href: string;
};

export type UseSettingsLayoutResult = {
  readonly items: readonly SettingsNavItem[];
  readonly activeId: SettingsNavId;
};

export function useSettingsLayout(): UseSettingsLayoutResult {
  const { t } = useTranslation();
  const platform = usePlatform();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const allItems: readonly SettingsNavItem[] = [
    {
      id: 'preferences',
      label: t('settings:nav.preferences.label'),
      sub: t('settings:nav.preferences.sub'),
      icon: SlidersHorizontal,
      color: 'var(--mfh-accent)',
      href: '/settings/preferences',
    },
    {
      id: 'categories',
      label: t('settings:nav.categories.label'),
      sub: t('settings:nav.categories.sub'),
      icon: Tag,
      color: 'var(--mfh-pos)',
      href: '/settings/categories',
    },
    {
      id: 'database',
      label: t('settings:nav.database.label'),
      sub: t('settings:nav.database.sub'),
      icon: Database,
      color: 'var(--mfh-categorical-5)',
      href: '/settings/database',
    },
    {
      id: 'about',
      label: t('settings:nav.about.label'),
      sub: t('settings:nav.about.sub'),
      icon: Info,
      color: 'var(--mfh-categorical-3)',
      href: '/settings/about',
    },
  ];

  // Capability, not platform name (CLAUDE.md principle 1) — Settings → Database is meaningless
  // without file-system access (screens.md: "platform file-system capability, not domain data"),
  // so web's nav rail simply has three entries instead of four rather than a disabled fourth.
  const items = platform.capabilities.canWriteFile ? allItems : allItems.filter((item) => item.id !== 'database');
  const activeId = items.find((item) => pathname.startsWith(item.href))?.id ?? 'preferences';

  return { items, activeId };
}
