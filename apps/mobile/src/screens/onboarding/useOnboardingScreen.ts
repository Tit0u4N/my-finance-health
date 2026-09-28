// ViewModel for OnboardingScreen.tsx (docs/spec/screens-mobile.md "Onboarding — bootstrap-adjacent").
//
// Reachable today from Settings ("Set up a new workspace"), not from a real bootstrap gate — the
// fixture workspace (createMockWorkspace.ts) is always already "open" and pre-seeded, so there is
// no empty-workspace state for a real first-run flow to land on yet (`EXPO_PUBLIC_STORAGE_MODE`
// only wires `inMemory` — see apps/mobile/.env.example). Two consequences worth stating plainly:
// - Step 0 ("choose a workspace file") has nothing real to do against an in-memory fixture that's
//   already open — it stays presentational local state, same spirit as apps/desktop's own
//   documented "bootstrap-only UI" scope for pieces ahead of their backing infra.
// - Step 1 (accounts) and step 2 (categories) DO call real @repo/app-core mutations against the
//   live fixture repositories — new accounts/categories genuinely appear everywhere else in the
//   app — but the fixture already ships its own seed accounts/categories, so running this adds to
//   that seed rather than starting from empty. Real workspace creation (once @repo/platform-expo
//   lands) starts genuinely empty and this mismatch goes away on its own.
//
// `onDone` is injected by the route file rather than this hook importing `expo-router`'s `router`
// singleton directly: OnboardingScreen.test.tsx renders this composed with @repo/app-core's real
// providers (Testing Library Native, no jest-expo), and `expo-router` pulls in `expo`'s native
// module registration on import — fine inside a real Expo runtime, unresolvable in that test.
// Keeping navigation a plain callback keeps the ViewModel itself framework-router-agnostic and
// trivially testable, same shape as onSuccess/onFinish handlers elsewhere in this file.

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useCreateAccount } from '@repo/app-core/mutations/useCreateAccount';
import { useCreateCategory } from '@repo/app-core/mutations/useCreateCategory';
import { useAccounts } from '@repo/app-core/queries/useAccounts';
import { formatMoney } from '@repo/app-core/selectors/formatMoney';
import type { Account, AccountType } from '@repo/domain/entities/account';
import type { Category, CategoryKind } from '@repo/domain/entities/category';
import type { CurrencyCode } from '@repo/domain/primitives/currency';
import { toMoney } from '@repo/domain/primitives/money';
import { useState } from 'react';
import { ACCOUNT_TYPE_ICON } from '@/ui/visuals';

const ACCOUNT_TYPE_ICON_SLUG: Record<AccountType, string> = {
  Checking: 'landmark',
  Savings: 'piggybank',
  Investment: 'trending',
  Cash: 'banknote',
};

const ACCOUNT_TYPE_COLOR: Record<AccountType, string> = {
  Checking: '#635BFF',
  Savings: '#10B981',
  Investment: '#8B5CF6',
  Cash: '#F59E0B',
};

export type OnboardingCategoryDraft = {
  readonly id: string;
  readonly name: string;
  readonly kind: CategoryKind;
  readonly color: string;
  readonly enabled: boolean;
};

const DEFAULT_CATEGORIES: readonly Omit<OnboardingCategoryDraft, 'enabled'>[] = [
  { color: '#10B981', id: 'salary', kind: 'income', name: 'Salary' },
  { color: '#06B6D4', id: 'freelance', kind: 'income', name: 'Freelance' },
  { color: '#84CC16', id: 'interest', kind: 'income', name: 'Interest' },
  { color: '#635BFF', id: 'rent', kind: 'expense', name: 'Rent' },
  { color: '#F59E0B', id: 'groceries', kind: 'expense', name: 'Groceries' },
  { color: '#06B6D4', id: 'transport', kind: 'expense', name: 'Transport' },
  { color: '#EC4899', id: 'eating-out', kind: 'expense', name: 'Eating out' },
  { color: '#8B5CF6', id: 'subscriptions', kind: 'expense', name: 'Subscriptions' },
  { color: '#EF4444', id: 'health', kind: 'expense', name: 'Health' },
];

export type AccountDraft = {
  readonly name: string;
  readonly type: AccountType;
  readonly currency: CurrencyCode;
  readonly balance: string;
};

export type OnboardingAccountRow = {
  readonly id: string;
  readonly name: string;
  readonly icon: (typeof ACCOUNT_TYPE_ICON)[Account['type']];
  readonly color: Account['color'];
  readonly typeLabel: Account['type'];
  readonly balanceLabel: string;
};

export type UseOnboardingScreenResult = {
  readonly step: 0 | 1 | 2;
  readonly onBack: () => void;
  // Step 0
  readonly selectedWorkspaceOption: 'create' | 'open' | null;
  readonly onSelectWorkspaceOption: (option: 'create' | 'open') => void;
  readonly onContinueFromStep0: () => void;
  // Step 1
  readonly accountDraft: AccountDraft;
  readonly onChangeAccountDraft: (patch: Partial<AccountDraft>) => void;
  readonly onAddAccount: () => void;
  readonly isAddAccountDisabled: boolean;
  readonly accounts: readonly OnboardingAccountRow[];
  readonly onContinueFromStep1: () => void;
  // Step 2
  readonly categories: readonly OnboardingCategoryDraft[];
  readonly onToggleCategory: (id: string) => void;
  readonly onFinish: () => void;
};

export function useOnboardingScreen(onDone: () => void): UseOnboardingScreenResult {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedWorkspaceOption, setSelectedWorkspaceOption] = useState<'create' | 'open' | null>(null);
  const [accountDraft, setAccountDraft] = useState<AccountDraft>({
    balance: '',
    currency: 'EUR',
    name: '',
    type: 'Checking',
  });
  const [categoryDrafts, setCategoryDrafts] = useState<readonly OnboardingCategoryDraft[]>(
    DEFAULT_CATEGORIES.map((category) => ({ ...category, enabled: true })),
  );

  const locale = useFormattingLocale();
  const accountsQuery = useAccounts();
  const createAccount = useCreateAccount();
  const createCategory = useCreateCategory();
  const accounts: OnboardingAccountRow[] = (accountsQuery.data ?? []).map((account) => ({
    balanceLabel: formatMoney(account.balance, account.currency, locale),
    color: account.color,
    icon: ACCOUNT_TYPE_ICON[account.type],
    id: account.id,
    name: account.name,
    typeLabel: account.type,
  }));

  const balanceMinorUnits = Math.round(Number.parseFloat(accountDraft.balance || '0') * 100);
  const isAddAccountDisabled =
    accountDraft.name.trim() === '' || Number.isNaN(balanceMinorUnits) || createAccount.isPending;

  const handleAddAccount = () => {
    if (isAddAccountDisabled) {
      return;
    }
    createAccount.mutate(
      {
        balance: toMoney(balanceMinorUnits),
        color: ACCOUNT_TYPE_COLOR[accountDraft.type] as Account['color'],
        currency: accountDraft.currency,
        icon: ACCOUNT_TYPE_ICON_SLUG[accountDraft.type],
        name: accountDraft.name.trim(),
        type: accountDraft.type,
      },
      {
        onSuccess: () =>
          setAccountDraft({ balance: '', currency: accountDraft.currency, name: '', type: accountDraft.type }),
      },
    );
  };

  const handleToggleCategory = (id: string) => {
    setCategoryDrafts((drafts) =>
      drafts.map((draft) => (draft.id === id ? { ...draft, enabled: !draft.enabled } : draft)),
    );
  };

  const handleFinish = () => {
    for (const category of categoryDrafts) {
      if (category.enabled) {
        createCategory.mutate({
          color: category.color as Category['color'],
          kind: category.kind,
          name: category.name,
        });
      }
    }
    onDone();
  };

  return {
    accountDraft,
    accounts,
    categories: categoryDrafts,
    isAddAccountDisabled,
    onAddAccount: handleAddAccount,
    onBack: () => setStep((current) => (current > 0 ? ((current - 1) as 0 | 1) : current)),
    onChangeAccountDraft: (patch) => setAccountDraft((draft) => ({ ...draft, ...patch })),
    onContinueFromStep0: () => setStep(1),
    onContinueFromStep1: () => setStep(2),
    onFinish: handleFinish,
    onSelectWorkspaceOption: setSelectedWorkspaceOption,
    onToggleCategory: handleToggleCategory,
    selectedWorkspaceOption,
    step,
  };
}
