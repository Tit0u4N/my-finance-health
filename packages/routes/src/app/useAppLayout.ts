// @repo/routes — level 3.
// ViewModel for AppLayout.tsx (routes.md §2's "App layout") — wires the preferences store's
// amounts-hidden toggle and the sidebar nav into @repo/ui's router-agnostic `Sidebar` props.

import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { SidebarNavItem } from '@repo/ui/components/Sidebar';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { ArrowLeftRight, Home, Repeat, Settings, TrendingUp, Wallet } from 'lucide-react';

const NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'recurring', label: 'Recurring', icon: Repeat },
  { id: 'invest', label: 'Investments', icon: TrendingUp },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
];

// Pinned below the main nav group, above the hide-amounts toggle — the mock's own sidebar
// footer placement for Settings.
const FOOTER_ITEMS: readonly SidebarNavItem[] = [{ id: 'settings', label: 'Settings', icon: Settings }];

const ROUTE_BY_NAV_ID: Partial<Record<string, string>> = {
  dashboard: '/',
  transactions: '/transactions',
  recurring: '/recurring',
  invest: '/investments',
  accounts: '/accounts',
  settings: '/settings',
};

export type UseAppLayoutResult = {
  readonly items: readonly SidebarNavItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  readonly amountsHidden: boolean;
  readonly onToggleAmountsHidden: () => void;
  readonly footerItems: readonly SidebarNavItem[];
  readonly collapsed: boolean;
};

// '/' is excluded from the prefix match below — every pathname starts with it, so it would
// swallow every other route; it falls out of the `?? 'dashboard'` default instead.
function resolveActiveId(pathname: string): string {
  const match = [...NAV_ITEMS, ...FOOTER_ITEMS].find((item) => {
    const to = ROUTE_BY_NAV_ID[item.id];
    return to !== undefined && to !== '/' && (pathname === to || pathname.startsWith(`${to}/`));
  });
  return match?.id ?? 'dashboard';
}

export function useAppLayout(): UseAppLayoutResult {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const amountsHidden = usePreferencesStore((state) => state.amountsHidden);
  const toggleAmountsHidden = usePreferencesStore((state) => state.toggleAmountsHidden);
  const collapsed = usePreferencesStore((state) => state.sidebarMode === 'collapsed');

  return {
    items: NAV_ITEMS,
    activeId: resolveActiveId(pathname),
    onSelect: (id) => {
      const to = ROUTE_BY_NAV_ID[id];
      if (to) {
        void navigate({ to });
      }
    },
    amountsHidden,
    onToggleAmountsHidden: toggleAmountsHidden,
    footerItems: FOOTER_ITEMS,
    collapsed,
  };
}
