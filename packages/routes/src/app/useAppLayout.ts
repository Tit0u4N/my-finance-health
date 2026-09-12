// @repo/routes — level 3.
// ViewModel for AppLayout.tsx (routes.md §2's "App layout") — wires the preferences store's
// amounts-hidden toggle and the sidebar nav into @repo/ui's router-agnostic `Sidebar` props.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { SidebarNavItem } from '@repo/ui/components/Sidebar';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { ArrowLeftRight, Home, Repeat, Settings, TrendingUp, Wallet } from 'lucide-react';

// id/icon/route stay module-level constants — only the label is resolved inside the hook, where
// `t` is available. resolveActiveId below only ever reads `id`, so it needs no translation itself.
const NAV_ITEM_DEFS = [
  { id: 'dashboard', icon: Home, labelKey: 'common:nav.overview' },
  { id: 'transactions', icon: ArrowLeftRight, labelKey: 'common:nav.transactions' },
  { id: 'recurring', icon: Repeat, labelKey: 'common:nav.recurring' },
  { id: 'invest', icon: TrendingUp, labelKey: 'common:nav.investments' },
  { id: 'accounts', icon: Wallet, labelKey: 'common:nav.accounts' },
] as const;

// Pinned below the main nav group, above the hide-amounts toggle — the mock's own sidebar
// footer placement for Settings.
const FOOTER_ITEM_DEFS = [{ id: 'settings', icon: Settings, labelKey: 'common:nav.settings' }] as const;

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
  readonly brandLabel: string;
  readonly showAmountsLabel: string;
  readonly hideAmountsLabel: string;
};

// '/' is excluded from the prefix match below — every pathname starts with it, so it would
// swallow every other route; it falls out of the `?? 'dashboard'` default instead.
function resolveActiveId(pathname: string): string {
  const match = [...NAV_ITEM_DEFS, ...FOOTER_ITEM_DEFS].find((item) => {
    const to = ROUTE_BY_NAV_ID[item.id];
    return to !== undefined && to !== '/' && (pathname === to || pathname.startsWith(`${to}/`));
  });
  return match?.id ?? 'dashboard';
}

export function useAppLayout(): UseAppLayoutResult {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const amountsHidden = usePreferencesStore((state) => state.amountsHidden);
  const toggleAmountsHidden = usePreferencesStore((state) => state.toggleAmountsHidden);
  const collapsed = usePreferencesStore((state) => state.sidebarMode === 'collapsed');

  const items: SidebarNavItem[] = NAV_ITEM_DEFS.map(({ id, icon, labelKey }) => ({ id, icon, label: t(labelKey) }));
  const footerItems: SidebarNavItem[] = FOOTER_ITEM_DEFS.map(({ id, icon, labelKey }) => ({
    id,
    icon,
    label: t(labelKey),
  }));

  return {
    items,
    activeId: resolveActiveId(pathname),
    onSelect: (id) => {
      const to = ROUTE_BY_NAV_ID[id];
      if (to) {
        void navigate({ to });
      }
    },
    amountsHidden,
    onToggleAmountsHidden: toggleAmountsHidden,
    footerItems,
    collapsed,
    brandLabel: t('common:brand.name'),
    showAmountsLabel: t('common:action.showAmounts'),
    hideAmountsLabel: t('common:action.hideAmounts'),
  };
}
