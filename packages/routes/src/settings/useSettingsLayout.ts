// @repo/routes — level 3.
// ViewModel for SettingsLayout.tsx — the 250px nav rail + content shell every /settings/* path
// mounts under (routes.md §1). No `ready` union: nothing here is async data.

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

const ALL_ITEMS: readonly SettingsNavItem[] = [
  {
    id: 'preferences',
    label: 'Preferences',
    sub: 'Theme, currency, layout',
    icon: SlidersHorizontal,
    color: 'var(--mfh-accent)',
    href: '/settings/preferences',
  },
  {
    id: 'categories',
    label: 'Categories',
    sub: 'Income and expenses',
    icon: Tag,
    color: 'var(--mfh-pos)',
    href: '/settings/categories',
  },
  {
    id: 'database',
    label: 'Database',
    sub: 'File, backups, export',
    icon: Database,
    color: 'var(--mfh-categorical-5)',
    href: '/settings/database',
  },
  {
    id: 'about',
    label: 'About',
    sub: 'Version and credits',
    icon: Info,
    color: 'var(--mfh-categorical-3)',
    href: '/settings/about',
  },
];

export function useSettingsLayout(): UseSettingsLayoutResult {
  const platform = usePlatform();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Capability, not platform name (CLAUDE.md principle 1) — Settings → Database is meaningless
  // without file-system access (screens.md: "platform file-system capability, not domain data"),
  // so web's nav rail simply has three entries instead of four rather than a disabled fourth.
  const items = platform.capabilities.canWriteFile ? ALL_ITEMS : ALL_ITEMS.filter((item) => item.id !== 'database');
  const activeId = items.find((item) => pathname.startsWith(item.href))?.id ?? 'preferences';

  return { items, activeId };
}
