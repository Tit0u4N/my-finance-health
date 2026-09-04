// End-to-end proof that the seven repositories compose correctly over a gateway, standing in
// for the missing UI this pass (plan's "Verification" section): seed accounts and categories in
// one batch, create transactions, assert balances move atomically, assert getBalanceHistory and
// list(criteria) return what Overview and Transactions need in a single call.

import type { CurrencyCode } from '@repo/domain/primitives/currency';
import type { Timezone } from '@repo/domain/primitives/dateTime';
import { isErr, isOk } from '@repo/domain/primitives/result';
import { createFakePlatform } from '@repo/platform/fakePlatform';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryGateway } from '../gateway/memoryGateway';
import { createRepositorySet } from './createRepositorySet';
import { WORKSPACE_SETTINGS_ID } from './workspaceSettingsRepository';

const timezone = 'Europe/Paris' as Timezone;

function setup() {
  const platform = createFakePlatform({ now: '2026-03-15T12:00:00.000Z' });
  const gateway = createMemoryGateway();
  const repositories = createRepositorySet({ gateway, clock: platform.clock, random: platform.random, timezone });
  return { platform, gateway, repositories };
}

describe('repository set — end-to-end over the memory gateway', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
  });

  it('seeds accounts and categories in one atomic batch (onboarding steps 1–2)', async () => {
    const { gateway } = ctx;

    const batchResult = await gateway.batch([
      {
        kind: 'write',
        entity: 'account',
        record: {
          id: 'a1' as never,
          name: 'Everyday',
          type: 'Checking',
          currency: 'EUR' as CurrencyCode,
          balance: 0 as never,
          color: '#3b82f6',
          icon: 'wallet',
          createdAt: '2026-03-15T12:00:00.000Z' as never,
          updatedAt: '2026-03-15T12:00:00.000Z' as never,
        },
      },
      {
        kind: 'write',
        entity: 'category',
        record: {
          id: 'c-groceries' as never,
          name: 'Groceries',
          color: '#22c55e',
          kind: 'expense',
          createdAt: '2026-03-15T12:00:00.000Z' as never,
          updatedAt: '2026-03-15T12:00:00.000Z' as never,
        },
      },
      {
        kind: 'write',
        entity: 'category',
        record: {
          id: 'c-salary' as never,
          name: 'Salary',
          color: '#3b82f6',
          kind: 'income',
          createdAt: '2026-03-15T12:00:00.000Z' as never,
          updatedAt: '2026-03-15T12:00:00.000Z' as never,
        },
      },
    ]);
    expect(isOk(batchResult)).toBe(true);

    const accounts = await ctx.repositories.accounts.list();
    const categories = await ctx.repositories.categories.list();
    expect(isOk(accounts) && accounts.value).toHaveLength(1);
    expect(isOk(categories) && categories.value).toHaveLength(2);
  });

  it('moves the account balance atomically when a transaction is created, updated, and deleted', async () => {
    const { repositories } = ctx;

    const account = await repositories.accounts.create({
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 100_000 as never,
      color: '#3b82f6',
      icon: 'wallet',
    });
    if (isErr(account)) {
      throw new Error('setup failed');
    }
    const category = await repositories.categories.create({ name: 'Groceries', color: '#22c55e', kind: 'expense' });
    if (isErr(category)) {
      throw new Error('setup failed');
    }

    const created = await repositories.transactions.create({
      date: '2026-03-10T09:00:00.000Z' as never,
      desc: 'Groceries run',
      amount: -4500 as never,
      cat: category.value.id,
      acc: account.value.id,
    });
    expect(isOk(created)).toBe(true);

    const afterCreate = await repositories.accounts.getById(account.value.id);
    expect(isOk(afterCreate) && afterCreate.value.balance).toBe(95_500);

    if (isErr(created)) {
      throw new Error('setup failed');
    }
    const updated = await repositories.transactions.update(created.value.id, { amount: -2000 as never });
    expect(isOk(updated)).toBe(true);

    const afterUpdate = await repositories.accounts.getById(account.value.id);
    expect(isOk(afterUpdate) && afterUpdate.value.balance).toBe(98_000);

    const deleted = await repositories.transactions.delete(created.value.id);
    expect(isOk(deleted)).toBe(true);

    const afterDelete = await repositories.accounts.getById(account.value.id);
    expect(isOk(afterDelete) && afterDelete.value.balance).toBe(100_000);
  });

  it('rejects a transaction whose sign disagrees with its category kind', async () => {
    const { repositories } = ctx;
    const account = await repositories.accounts.create({
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 0 as never,
      color: '#3b82f6',
      icon: 'wallet',
    });
    const category = await repositories.categories.create({ name: 'Groceries', color: '#22c55e', kind: 'expense' });
    if (isErr(account) || isErr(category)) {
      throw new Error('setup failed');
    }

    const result = await repositories.transactions.create({
      date: '2026-03-10T09:00:00.000Z' as never,
      desc: 'Wrongly signed',
      amount: 4500 as never, // positive, but the category is 'expense'
      cat: category.value.id,
      acc: account.value.id,
    });

    expect(isErr(result) && result.error.kind).toBe('validation');
    const untouchedAccount = await repositories.accounts.getById(account.value.id);
    expect(isOk(untouchedAccount) && untouchedAccount.value.balance).toBe(0);
  });

  it('list(criteria) answers a Transactions-ledger-shaped query in one call', async () => {
    const { repositories } = ctx;
    const account1 = await repositories.accounts.create({
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 0 as never,
      color: '#3b82f6',
      icon: 'wallet',
    });
    const account2 = await repositories.accounts.create({
      name: 'Savings',
      type: 'Savings',
      currency: 'EUR',
      balance: 0 as never,
      color: '#22c55e',
      icon: 'piggy-bank',
    });
    const expense = await repositories.categories.create({ name: 'Groceries', color: '#22c55e', kind: 'expense' });
    if (isErr(account1) || isErr(account2) || isErr(expense)) {
      throw new Error('setup failed');
    }

    await repositories.transactions.create({
      date: '2026-03-10T09:00:00.000Z' as never,
      desc: 'Groceries run',
      amount: -4500 as never,
      cat: expense.value.id,
      acc: account1.value.id,
    });
    await repositories.transactions.create({
      date: '2026-03-11T09:00:00.000Z' as never,
      desc: 'Coffee',
      amount: -350 as never,
      cat: expense.value.id,
      acc: account2.value.id,
    });

    const result = await repositories.transactions.list({
      accountIds: [account1.value.id],
      amountSign: 'negative',
      text: 'grocer',
    });

    expect(isOk(result) && result.value.map((t) => t.desc)).toEqual(['Groceries run']);
  });

  it('getBalanceHistory answers Overview/Account-detail with a bounded, derived series', async () => {
    const { repositories } = ctx;
    const account = await repositories.accounts.create({
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 100_000 as never,
      color: '#3b82f6',
      icon: 'wallet',
    });
    const category = await repositories.categories.create({ name: 'Groceries', color: '#22c55e', kind: 'expense' });
    if (isErr(account) || isErr(category)) {
      throw new Error('setup failed');
    }

    await repositories.transactions.create({
      date: '2026-03-10T09:00:00.000Z' as never,
      desc: 'Groceries run',
      amount: -4500 as never,
      cat: category.value.id,
      acc: account.value.id,
    });

    // The account opened at 100_000; the -4500 transaction is the only, most recent activity, so
    // the current (maintained) balance of 95_500 is exactly what this one history point reports.
    const history = await repositories.accounts.getBalanceHistory(account.value.id, '1m');
    expect(isOk(history) && history.value).toEqual([{ date: '2026-03-10', balance: 95_500 }]);
  });

  it('records an investment value snapshot, updating Investment.current in the same batch', async () => {
    const { repositories } = ctx;
    const investment = await repositories.investments.create({
      name: 'World ETF (CW8)',
      ticker: 'CW8',
      qty: 10,
      avg: 40_000 as never,
      current: 40_000 as never,
      color: '#6366f1',
    });
    if (isErr(investment)) {
      throw new Error('setup failed');
    }

    const snapshot = await repositories.investments.recordValueSnapshot(investment.value.id, {
      date: '2026-03-14T00:00:00.000Z' as never,
      price: 45_000 as never,
    });
    expect(isOk(snapshot)).toBe(true);

    const updatedInvestment = await repositories.investments.getById(investment.value.id);
    expect(isOk(updatedInvestment) && updatedInvestment.value.current).toBe(45_000);

    const history = await repositories.investments.getValueHistory(investment.value.id, 'all');
    expect(isOk(history) && history.value).toEqual([{ date: '2026-03-14T00:00:00.000Z', price: 45_000 }]);
  });

  it('the recurring-rule active toggle is an ordinary patch', async () => {
    const { repositories } = ctx;
    const account = await repositories.accounts.create({
      name: 'Everyday',
      type: 'Checking',
      currency: 'EUR',
      balance: 0 as never,
      color: '#3b82f6',
      icon: 'wallet',
    });
    const category = await repositories.categories.create({ name: 'Rent', color: '#ef4444', kind: 'expense' });
    if (isErr(account) || isErr(category)) {
      throw new Error('setup failed');
    }

    const rule = await repositories.recurringRules.create({
      desc: 'Rent',
      amount: -120_000 as never,
      freq: 'Monthly',
      cat: category.value.id,
      acc: account.value.id,
      startDate: '2026-01-01' as never,
      active: true,
    });
    if (isErr(rule)) {
      throw new Error('setup failed');
    }

    const toggled = await repositories.recurringRules.update(rule.value.id, { active: false });
    expect(isOk(toggled) && toggled.value.active).toBe(false);
  });

  it('WorkspaceSettings.get resolves once seeded, and setBaseCurrency updates it', async () => {
    const { gateway, repositories, platform } = ctx;

    await gateway.write('workspaceSettings', {
      id: WORKSPACE_SETTINGS_ID as never,
      timezone,
      baseCurrency: 'EUR' as CurrencyCode,
      createdAt: platform.clock.now() as never,
      updatedAt: platform.clock.now() as never,
    });

    const updated = await repositories.workspaceSettings.setBaseCurrency('USD');
    expect(isOk(updated) && updated.value.baseCurrency).toBe('USD');

    const fetched = await repositories.workspaceSettings.get();
    expect(isOk(fetched) && fetched.value.baseCurrency).toBe('USD');
    expect(isOk(fetched) && fetched.value.timezone).toBe(timezone);
  });
});
