// @repo/routes — level 3.
// ViewModel for AppLayout.tsx (routes.md §2's "App layout") — wires the preferences store's
// amounts-hidden toggle and the sidebar nav into @repo/ui's router-agnostic `Sidebar` props.

import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { SidebarNavItem } from '@repo/ui/components/Sidebar';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { ArrowLeftRight, Home, Repeat, TrendingUp, Wallet } from 'lucide-react';

// Only "/" has a route this pass (routes.md §1 lists the full tree; the rest land in later
// passes) — every other entry renders disabled rather than a dead link.
const NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, disabled: true },
  { id: 'recurring', label: 'Recurring', icon: Repeat, disabled: true },
  { id: 'invest', label: 'Investments', icon: TrendingUp, disabled: true },
  { id: 'accounts', label: 'Accounts', icon: Wallet, disabled: true },
];

const ROUTE_BY_NAV_ID: Partial<Record<string, string>> = { dashboard: '/' };

export type UseAppLayoutResult = {
  readonly items: readonly SidebarNavItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  readonly amountsHidden: boolean;
  readonly onToggleAmountsHidden: () => void;
};

export function useAppLayout(): UseAppLayoutResult {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const amountsHidden = usePreferencesStore((state) => state.amountsHidden);
  const toggleAmountsHidden = usePreferencesStore((state) => state.toggleAmountsHidden);

  const activeId = NAV_ITEMS.find((item) => ROUTE_BY_NAV_ID[item.id] === pathname)?.id ?? 'dashboard';

  return {
    items: NAV_ITEMS,
    activeId,
    onSelect: (id) => {
      const to = ROUTE_BY_NAV_ID[id];
      if (to) {
        void navigate({ to });
      }
    },
    amountsHidden,
    onToggleAmountsHidden: toggleAmountsHidden,
  };
}
