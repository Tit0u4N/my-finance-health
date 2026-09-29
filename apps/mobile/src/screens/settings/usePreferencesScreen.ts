// ViewModel for PreferencesScreen.tsx (screens.md "Settings → Preferences"). Mirrors
// packages/routes/src/settings/usePreferencesScreen.ts's composition exactly, minus
// `sidebarMode`/`onSidebarModeChange` — `SidebarMode` is a DOM-only concept (mobile has a tab bar,
// not a collapsible sidebar), so this screen never reads or exposes it, rather than inventing a
// mobile stand-in (open-questions.md #11's "not an evidenced product feature" reasoning extends
// to a tab-bar-style picker exactly the way it already extends to accent and density).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useUpdateBaseCurrency } from '@repo/app-core/mutations/useUpdateBaseCurrency';
import { useUpsertExchangeRate } from '@repo/app-core/mutations/useUpsertExchangeRate';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { findExchangeRate } from '@repo/app-core/selectors/convertToBaseCurrency';
import { formatRate } from '@repo/app-core/selectors/formatRate';
import { parseRateInput } from '@repo/app-core/selectors/parseRateInput';
import type { LanguagePreference, ThemeMode } from '@repo/app-core/stores/createPreferencesStore';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { useState } from 'react';

export type PreferencesRateRow = {
  readonly currency: CurrencyCode;
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (text: string) => void;
  readonly onCommit: () => void;
  readonly isMissing: boolean;
  readonly isSaving: boolean;
};

export type BaseCurrencyOption = { readonly value: CurrencyCode; readonly label: string; readonly glyph: string };

export type UsePreferencesScreenResult =
  | { readonly ready: false }
  | {
      readonly ready: true;
      readonly themeMode: ThemeMode;
      readonly onThemeModeChange: (mode: ThemeMode) => void;
      readonly languageOption: LanguagePreference;
      readonly onLanguageChange: (language: LanguagePreference) => void;
      readonly baseCurrency: CurrencyCode;
      readonly baseCurrencyOptions: readonly BaseCurrencyOption[];
      readonly onBaseCurrencyChange: (currency: CurrencyCode) => void;
      readonly isBaseCurrencySaving: boolean;
      readonly rates: readonly PreferencesRateRow[];
    };

const CURRENCY_GLYPH: Record<CurrencyCode, string> = { EUR: '€', GBP: '£', USD: '$' };
const BASE_CURRENCY_OPTIONS: readonly BaseCurrencyOption[] = (['EUR', 'USD', 'GBP'] as const).map((currency) => ({
  glyph: CURRENCY_GLYPH[currency],
  label: currency,
  value: currency,
}));

export function usePreferencesScreen(): UsePreferencesScreenResult {
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const accountsQuery = useAccounts();
  const locale = useFormattingLocale();

  const themeMode = usePreferencesStore((state) => state.themeMode);
  const setThemeMode = usePreferencesStore((state) => state.setThemeMode);
  const languageOption = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  const updateBaseCurrency = useUpdateBaseCurrency();
  const upsertRate = useUpsertExchangeRate();

  const [drafts, setDrafts] = useState<Partial<Record<CurrencyCode, string>>>({});

  const ready = settingsQuery.data !== undefined && ratesQuery.data !== undefined && accountsQuery.data !== undefined;
  if (!ready) {
    return { ready: false };
  }

  const settings = settingsQuery.data as NonNullable<typeof settingsQuery.data>;
  const rates = ratesQuery.data as NonNullable<typeof ratesQuery.data>;
  const accounts = accountsQuery.data as NonNullable<typeof accountsQuery.data>;

  // One row per non-base currency an account actually holds, not every CurrencyCode the schema
  // allows — a currency the workspace never uses needs no rate.
  const currenciesInUse = [...new Set(accounts.map((account) => account.currency))].filter(
    (currency) => currency !== settings.baseCurrency,
  );

  const rateRows: PreferencesRateRow[] = currenciesInUse.map((currency) => {
    const existing = findExchangeRate(rates, currency);
    const draft = drafts[currency];
    return {
      currency,
      isMissing: existing === undefined,
      isSaving: upsertRate.isPending && upsertRate.variables?.currency === currency,
      label: `${currency} → ${settings.baseCurrency}`,
      onCommit: () => {
        const text = drafts[currency];
        if (text === undefined) {
          return;
        }
        const rateToBase = parseRateInput(text);
        if (rateToBase === undefined) {
          return;
        }
        upsertRate.mutate(
          { currency, rateToBase },
          { onSuccess: () => setDrafts((current) => ({ ...current, [currency]: undefined })) },
        );
      },
      onValueChange: (text) => setDrafts((current) => ({ ...current, [currency]: text })),
      value: draft ?? (existing ? formatRate(existing.rateToBase, locale) : ''),
    };
  });

  return {
    baseCurrency: settings.baseCurrency,
    baseCurrencyOptions: BASE_CURRENCY_OPTIONS,
    isBaseCurrencySaving: updateBaseCurrency.isPending,
    languageOption,
    onBaseCurrencyChange: (currency) => updateBaseCurrency.mutate(currency),
    onLanguageChange: setLanguage,
    onThemeModeChange: setThemeMode,
    rates: rateRows,
    ready: true,
    themeMode,
  };
}
