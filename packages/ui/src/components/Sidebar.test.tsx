import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Settings, Wallet } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar, type SidebarNavItem } from './Sidebar';

const ITEMS: readonly SidebarNavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
];
const FOOTER_ITEMS: readonly SidebarNavItem[] = [{ id: 'settings', label: 'Settings', icon: Settings }];

describe('Sidebar', () => {
  it('highlights the active item and calls onSelect for the clicked one', async () => {
    const onSelect = vi.fn();
    render(
      <Sidebar
        items={ITEMS}
        activeId="accounts"
        onSelect={onSelect}
        amountsHidden={false}
        onToggleAmountsHidden={() => undefined}
        brandLabel="My Finance Health"
        showAmountsLabel="Show amounts"
        hideAmountsLabel="Hide amounts"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }));

    expect(onSelect).toHaveBeenCalledWith('dashboard');
  });

  it('renders footer items in a separate group, e.g. Settings', () => {
    render(
      <Sidebar
        items={ITEMS}
        activeId="settings"
        onSelect={() => undefined}
        amountsHidden={false}
        onToggleAmountsHidden={() => undefined}
        brandLabel="My Finance Health"
        showAmountsLabel="Show amounts"
        hideAmountsLabel="Hide amounts"
        footerItems={FOOTER_ITEMS}
      />,
    );

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('collapsed mode drops visible labels but keeps every item reachable by its accessible name', () => {
    render(
      <Sidebar
        items={ITEMS}
        activeId="dashboard"
        onSelect={() => undefined}
        amountsHidden={false}
        onToggleAmountsHidden={() => undefined}
        brandLabel="My Finance Health"
        showAmountsLabel="Show amounts"
        hideAmountsLabel="Hide amounts"
        footerItems={FOOTER_ITEMS}
        collapsed
      />,
    );

    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide amounts' })).toBeInTheDocument();
  });
});
