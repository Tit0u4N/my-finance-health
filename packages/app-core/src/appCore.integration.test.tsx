// End-to-end proof that the app stage's providers, query hooks, mutation hooks, and a selector
// compose correctly over the memory gateway — the app-core half of the plan's "Verification"
// section (the data half lives in @repo/data's repositories.integration.test.ts).

import { createMemoryGateway } from '@repo/data/gateway/memoryGateway';
import { createRepositorySet } from '@repo/data/repositories/createRepositorySet';
import type { Timezone } from '@repo/domain/primitives/dateTime';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useCreateAccount } from './mutations/useCreateAccount';
import { useCreateCategory } from './mutations/useCreateCategory';
import { useCreateTransaction } from './mutations/useCreateTransaction';
import { AppStageProviders } from './providers/AppStageProviders';
import { useAccounts } from './queries/useAccounts';
import { useTransactions } from './queries/useTransactions';
import { computePeriodTotals } from './selectors/periodTotals';

function setup() {
  const platform = createFakePlatform({ now: '2026-03-15T12:00:00.000Z' });
  const gateway = createMemoryGateway();
  const repositories = createRepositorySet({
    gateway,
    clock: platform.clock,
    random: platform.random,
    timezone: 'Europe/Paris' as Timezone,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <AppStageProviders platform={platform} repositories={repositories} queryClient={queryClient}>
      {children}
    </AppStageProviders>
  );

  return renderHook(
    () => ({
      accounts: useAccounts(),
      transactions: useTransactions({}),
      createAccount: useCreateAccount(),
      createCategory: useCreateCategory(),
      createTransaction: useCreateTransaction(),
    }),
    { wrapper },
  );
}

describe('app-core over the memory gateway', () => {
  it('mounts the app stage, writes through mutations, and a selector reduces what the queries return', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.accounts.isSuccess).toBe(true));
    expect(result.current.accounts.data).toEqual([]);

    await act(async () => {
      const account = await result.current.createAccount.mutateAsync({
        name: 'Everyday',
        type: 'Checking',
        currency: 'EUR',
        balance: 100_000 as never,
        color: '#3b82f6',
        icon: 'wallet',
      });
      const category = await result.current.createCategory.mutateAsync({
        name: 'Groceries',
        color: '#22c55e',
        kind: 'expense',
      });
      await result.current.createTransaction.mutateAsync({
        date: '2026-03-10T09:00:00.000Z' as never,
        desc: 'Groceries run',
        amount: -4500 as never,
        cat: category.id,
        acc: account.id,
      });
    });

    // useCreateTransaction invalidates both accounts and transactions — both queries refetch.
    await waitFor(() => expect(result.current.accounts.data).toHaveLength(1));
    expect(result.current.accounts.data?.[0]?.balance).toBe(95_500);

    await waitFor(() => expect(result.current.transactions.data).toHaveLength(1));
    expect(computePeriodTotals(result.current.transactions.data ?? [])).toEqual({
      income: 0,
      expense: 4500,
      net: -4500,
      rate: 0,
    });
  });
});
