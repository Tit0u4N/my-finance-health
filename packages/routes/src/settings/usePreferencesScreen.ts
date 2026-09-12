// @repo/routes — level 3.
// ViewModel for PreferencesScreen.tsx (screens.md "Settings → Preferences"). Accent and density
// are NOT here — open-questions.md #11 drops both as non-v1 features; the store that used to
// carry them no longer does either (createPreferencesStore.ts).

import { useUpdateBaseCurrency } from '@repo/app-core/mutations/useUpdateBaseCurrency';
import { useUpsertExchangeRate } from '@repo/app-core/mutations/useUpsertExchangeRate';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { useExchangeRates } from '@repo/app-core/queries/useExchangeRates';
import { useWorkspaceSettings } from '@repo/app-core/queries/useWorkspaceSettings';
import { findExchangeRate } from '@repo/app-core/selectors/convertToBaseCurrency';
import { parseRateInput } from '@repo/app-core/selectors/parseRateInput';
import type { LanguagePreference, SidebarMode, ThemeMode } from '@repo/app-core/stores/createPreferencesStore';
import { usePreferencesStore } from '@repo/app-core/stores/PreferencesProvider';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { rateToDecimal } from '@repo/domain/primitives/rate';
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
      readonly sidebarMode: SidebarMode;
      readonly onSidebarModeChange: (mode: SidebarMode) => void;
      readonly languageOption: LanguagePreference;
      readonly onLanguageChange: (language: LanguagePreference) => void;
      readonly baseCurrency: CurrencyCode;
      readonly baseCurrencyOptions: readonly BaseCurrencyOption[];
      readonly onBaseCurrencyChange: (currency: CurrencyCode) => void;
      readonly isBaseCurrencySaving: boolean;
      readonly rates: readonly PreferencesRateRow[];
    };

const CURRENCY_GLYPH: Record<CurrencyCode, string> = { EUR: '€', USD: '$', GBP: '£' };
const BASE_CURRENCY_OPTIONS: readonly BaseCurrencyOption[] = (['EUR', 'USD', 'GBP'] as const).map((currency) => ({
  value: currency,
  label: currency,
  glyph: CURRENCY_GLYPH[currency],
}));

export function usePreferencesScreen(): UsePreferencesScreenResult {
  const settingsQuery = useWorkspaceSettings();
  const ratesQuery = useExchangeRates();
  const accountsQuery = useAccounts();

  const themeMode = usePreferencesStore((state) => state.themeMode);
  const setThemeMode = usePreferencesStore((state) => state.setThemeMode);
  const sidebarMode = usePreferencesStore((state) => state.sidebarMode);
  const setSidebarMode = usePreferencesStore((state) => state.setSidebarMode);
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

  // One row per non-base currency an account actually holds — not every CurrencyCode the schema
  // allows. A currency the workspace never uses needs no rate (domain-model.md's ExchangeRate:
  // "if a workspace never holds a non-base-currency account, no ExchangeRate record is ever needed").
  const currenciesInUse = [...new Set(accounts.map((account) => account.currency))].filter(
    (currency) => currency !== settings.baseCurrency,
  );

  const rateRows: PreferencesRateRow[] = currenciesInUse.map((currency) => {
    const existing = findExchangeRate(rates, currency);
    const draft = drafts[currency];
    return {
      currency,
      label: `${currency} → ${settings.baseCurrency}`,
      value: draft ?? (existing ? String(rateToDecimal(existing.rateToBase)) : ''),
      onValueChange: (text) => setDrafts((current) => ({ ...current, [currency]: text })),
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
      isMissing: existing === undefined,
      isSaving: upsertRate.isPending && upsertRate.variables?.currency === currency,
    };
  });

  return {
    ready: true,
    themeMode,
    onThemeModeChange: setThemeMode,
    sidebarMode,
    onSidebarModeChange: setSidebarMode,
    languageOption,
    onLanguageChange: setLanguage,
    baseCurrency: settings.baseCurrency,
    baseCurrencyOptions: BASE_CURRENCY_OPTIONS,
    onBaseCurrencyChange: (currency) => updateBaseCurrency.mutate(currency),
    isBaseCurrencySaving: updateBaseCurrency.isPending,
    rates: rateRows,
  };
}
