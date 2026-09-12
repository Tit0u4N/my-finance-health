// @repo/routes — level 3.
// View for Settings → Preferences (screens.md) — JSX and @repo/ui composition only. useTranslation
// is allowed here for static copy — everything derived (plurals, interpolation) stays in the
// ViewModel. The Theme/Sidebar/Language OptionGrid arrays are built here rather than in the
// ViewModel: their labels carry lucide-react icons, which @repo/ui may not resolve from @repo/i18n
// key strings (start-roadmap.md §6), and Theme already established this pattern before Language
// existed.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { EmptyState } from '@repo/ui/components/EmptyState';
import { Input } from '@repo/ui/components/Input';
import { OptionGrid } from '@repo/ui/components/OptionGrid';
import { Panel } from '@repo/ui/components/Panel';
import { Coins, Globe, Languages, Moon, Sun } from 'lucide-react';
import { usePreferencesScreen } from './usePreferencesScreen';

export function PreferencesScreen() {
  const { t } = useTranslation();
  const screen = usePreferencesScreen();
  if (!screen.ready) {
    return <div className="text-body text-muted">{t('common:state.loading')}</div>;
  }

  const {
    themeMode,
    onThemeModeChange,
    sidebarMode,
    onSidebarModeChange,
    languageOption,
    onLanguageChange,
    baseCurrency,
    baseCurrencyOptions,
    onBaseCurrencyChange,
    rates,
  } = screen;

  const themeOptions = [
    { value: 'light' as const, label: t('settings:preferences.theme.options.light'), icon: Sun },
    { value: 'dark' as const, label: t('settings:preferences.theme.options.dark'), icon: Moon },
    { value: 'system' as const, label: t('settings:preferences.theme.options.system'), icon: Globe },
  ];

  const sidebarOptions = [
    { value: 'expanded' as const, label: t('settings:preferences.sidebar.options.expanded') },
    { value: 'collapsed' as const, label: t('settings:preferences.sidebar.options.collapsed') },
  ];

  // "English"/"Français" are endonyms — always literal, never run through t(), regardless of the
  // active UI language (CLAUDE.md's "What to NEVER translate").
  const languageOptions = [
    { value: 'system' as const, label: t('settings:preferences.language.options.system'), icon: Languages },
    { value: 'en' as const, label: 'English' },
    { value: 'fr' as const, label: 'Français' },
  ];

  return (
    <>
      <Panel
        title={t('settings:preferences.appearancePanel.title')}
        subtitle={t('settings:preferences.appearancePanel.subtitle')}
      >
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-foreground text-label-strong">{t('settings:preferences.theme.label')}</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">{t('settings:preferences.theme.description')}</div>
            <OptionGrid
              value={themeMode}
              onChange={onThemeModeChange}
              options={themeOptions}
              columns={3}
              ariaLabel={t('settings:preferences.theme.label')}
            />
          </div>
          <div>
            <div className="text-foreground text-label-strong">{t('settings:preferences.sidebar.label')}</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">{t('settings:preferences.sidebar.description')}</div>
            <OptionGrid
              value={sidebarMode}
              onChange={onSidebarModeChange}
              options={sidebarOptions}
              columns={2}
              ariaLabel={t('settings:preferences.sidebar.label')}
            />
          </div>
        </div>
      </Panel>

      <Panel title={t('settings:preferences.regionalPanel.title')}>
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-foreground text-label-strong">{t('settings:preferences.language.label')}</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">
              {t('settings:preferences.language.description')}
            </div>
            <OptionGrid
              value={languageOption}
              onChange={onLanguageChange}
              options={languageOptions}
              columns={3}
              ariaLabel={t('settings:preferences.language.label')}
            />
          </div>
          <div>
            <div className="text-foreground text-label-strong">{t('settings:preferences.baseCurrency.label')}</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">
              {t('settings:preferences.baseCurrency.description')}
            </div>
            <OptionGrid
              value={baseCurrency}
              onChange={onBaseCurrencyChange}
              options={baseCurrencyOptions}
              columns={3}
              ariaLabel={t('settings:preferences.baseCurrency.label')}
            />
          </div>
          <div>
            <div className="text-foreground text-label-strong">{t('settings:preferences.exchangeRates.label')}</div>
            <div className="mt-0.5 mb-2.5 text-body-sm text-muted">
              {t('settings:preferences.exchangeRates.description', { baseCurrency })}
            </div>
            {rates.length === 0 ? (
              <EmptyState
                icon={Coins}
                title={t('settings:preferences.exchangeRates.emptyTitle')}
                subtitle={t('settings:preferences.exchangeRates.emptySubtitle')}
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
                    {...(rate.isMissing && { error: t('settings:preferences.exchangeRates.missingRateError') })}
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
