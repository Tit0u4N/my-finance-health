// @repo/routes — level 3.
// View for Settings → Preferences (screens.md) — JSX and @repo/ui composition only.

import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { OptionGrid } from '@repo/ui/components/OptionGrid';
import { Panel } from '@repo/ui/components/Panel';
import { Coins, Globe, Moon, Sun } from 'lucide-react';
import { usePreferencesScreen } from './usePreferencesScreen';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'Auto', icon: Globe },
];

const SIDEBAR_OPTIONS = [
  { value: 'expanded' as const, label: 'Expanded' },
  { value: 'collapsed' as const, label: 'Icons only' },
];

export function PreferencesScreen() {
  const screen = usePreferencesScreen();
  if (!screen.ready) {
    return <div className="text-body text-muted">Loading…</div>;
  }

  const {
    themeMode,
    onThemeModeChange,
    sidebarMode,
    onSidebarModeChange,
    baseCurrency,
    baseCurrencyOptions,
    onBaseCurrencyChange,
    rates,
  } = screen;

  return (
    <>
      <Panel title="Appearance" subtitle="Applies instantly across the app">
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-foreground text-label-strong">Theme</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">Light, dark or follow the system</div>
            <OptionGrid
              value={themeMode}
              onChange={onThemeModeChange}
              options={THEME_OPTIONS}
              columns={3}
              ariaLabel="Theme"
            />
          </div>
          <div>
            <div className="text-foreground text-label-strong">Sidebar</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">Full labels or icons only</div>
            <OptionGrid
              value={sidebarMode}
              onChange={onSidebarModeChange}
              options={SIDEBAR_OPTIONS}
              columns={2}
              ariaLabel="Sidebar"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Regional">
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-foreground text-label-strong">Base currency</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">Display currency for cross-account totals</div>
            <OptionGrid
              value={baseCurrency}
              onChange={onBaseCurrencyChange}
              options={baseCurrencyOptions}
              columns={3}
              ariaLabel="Base currency"
            />
          </div>
          <div>
            <div className="text-foreground text-label-strong">Exchange rates</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">
              1 unit of the currency equals this many units of {baseCurrency}
            </div>
            {rates.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No other currencies"
                subtitle="Add an account in another currency and its rate will show up here."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {rates.map((rate) => (
                  <Input
                    key={rate.currency}
                    label={rate.label}
                    inputMode="decimal"
                    value={rate.value}
                    onChange={(event) => rate.onValueChange(event.target.value)}
                    onBlur={rate.onCommit}
                    {...(rate.isMissing && { error: 'No rate set yet — totals treat this currency as 1:1.' })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
