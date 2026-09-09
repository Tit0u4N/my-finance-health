// Temporary mock data — deleted whole-cloth once real bootstrap/workspace opening lands (see
// createMockWorkspace.ts). Ported from the Claude Design mock's `data.js`: same accounts,
// categories, and transactions, translated to the real domain shapes — cents instead of floats
// (open-questions.md #1), no `type` field on Transaction/RecurringRule (open-questions.md #6),
// `startDate` instead of a stored `next` (open-questions.md #7). Every record is built through the
// entity's own zod schema, the same construction path a repository `create` call would take.

import type { MemoryGatewaySeed } from '@repo/data/gateway/memoryGateway';
import { WORKSPACE_SETTINGS_ID } from '@repo/data/repositories/workspaceSettingsRepository';
import { accountSchema } from '@repo/domain/entities/account';
import { categorySchema } from '@repo/domain/entities/category';
import { recurringRuleSchema } from '@repo/domain/entities/recurringRule';
import { transactionSchema } from '@repo/domain/entities/transaction';
import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';

// The fixed anchor the fake platform's clock reports as "now" (createMockWorkspace.ts) — every
// relative date below ("9 days from now", "3 days ago") is written against this same anchor.
export const MOCK_NOW = '2026-09-09T09:00:00.000Z';
const AUDIT_TIMESTAMP = '2026-01-01T00:00:00.000Z';

function daysFromAnchor(offset: number): string {
  const anchor = new Date(MOCK_NOW);
  anchor.setUTCDate(anchor.getUTCDate() + offset);
  return anchor.toISOString();
}

const workspaceSettings = [
  workspaceSettingsSchema.parse({
    id: WORKSPACE_SETTINGS_ID,
    timezone: 'Europe/Paris',
    baseCurrency: 'EUR',
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  }),
];

const accounts = [
  accountSchema.parse({
    id: 'a1',
    name: 'Everyday',
    type: 'Checking',
    currency: 'EUR',
    balance: 328_462,
    color: '#635BFF',
    icon: 'landmark',
    last4: '4421',
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  }),
  accountSchema.parse({
    id: 'a2',
    name: 'Reserve',
    type: 'Savings',
    currency: 'EUR',
    balance: 1_245_000,
    color: '#10B981',
    icon: 'piggybank',
    last4: '8810',
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  }),
  accountSchema.parse({
    id: 'a3',
    name: 'Cash',
    type: 'Cash',
    currency: 'EUR',
    balance: 18_000,
    color: '#F59E0B',
    icon: 'banknote',
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  }),
];

const categoryInput = (id: string, name: string, color: string, kind: 'income' | 'expense') =>
  categorySchema.parse({ id, name, color, kind, createdAt: AUDIT_TIMESTAMP, updatedAt: AUDIT_TIMESTAMP });

const categories = [
  categoryInput('c-sal', 'Salary', '#10B981', 'income'),
  categoryInput('c-frl', 'Freelance', '#06B6D4', 'income'),
  categoryInput('c-int', 'Interest', '#84CC16', 'income'),
  categoryInput('c-rnt', 'Rent', '#635BFF', 'expense'),
  categoryInput('c-grc', 'Groceries', '#F59E0B', 'expense'),
  categoryInput('c-tra', 'Transport', '#06B6D4', 'expense'),
  categoryInput('c-eat', 'Eating out', '#EC4899', 'expense'),
  categoryInput('c-sub', 'Subscriptions', '#8B5CF6', 'expense'),
  categoryInput('c-hlt', 'Health', '#EF4444', 'expense'),
];

const transactionInput = (id: string, offset: number, desc: string, amount: number, cat: string, acc: string) =>
  transactionSchema.parse({
    id,
    date: daysFromAnchor(offset),
    desc,
    amount,
    cat,
    acc,
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  });

const transactions = [
  transactionInput('t01', 0, 'Carrefour Market', -5_420, 'c-grc', 'a1'),
  transactionInput('t02', -1, 'Métro pass', -2_250, 'c-tra', 'a1'),
  transactionInput('t03', -2, 'Le Petit Bistro', -3_800, 'c-eat', 'a1'),
  transactionInput('t04', -3, 'Spotify', -1_099, 'c-sub', 'a1'),
  transactionInput('t05', -4, 'Pharmacie', -1_740, 'c-hlt', 'a1'),
  transactionInput('t06', -5, 'Freelance — Atelier Co', 120_000, 'c-frl', 'a1'),
  transactionInput('t07', -7, 'Monoprix', -8_275, 'c-grc', 'a1'),
  transactionInput('t08', -8, 'Uber', -1_420, 'c-tra', 'a1'),
  transactionInput('t09', -10, 'Café de Flore', -950, 'c-eat', 'a1'),
  transactionInput('t10', -12, 'iCloud+', -299, 'c-sub', 'a1'),
  transactionInput('t11', -15, 'Salaire — Studio Nord', 340_000, 'c-sal', 'a1'),
  transactionInput('t12', -15, 'Loyer — septembre', -128_000, 'c-rnt', 'a1'),
  transactionInput('t13', -18, 'Auchan', -6_410, 'c-grc', 'a1'),
  transactionInput('t14', -20, 'Pizzeria Pino', -2_800, 'c-eat', 'a1'),
  transactionInput('t15', -22, 'Intérêts épargne', 1_840, 'c-int', 'a2'),
  transactionInput('t16', -24, 'Netflix', -1_349, 'c-sub', 'a1'),
  transactionInput('t17', -26, 'Pharmacie centrale', -2_210, 'c-hlt', 'a1'),
  transactionInput('t18', -28, 'Vélib', -350, 'c-tra', 'a1'),
];

const recurringRuleInput = (
  id: string,
  desc: string,
  amount: number,
  freq: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly',
  cat: string,
  acc: string,
  startDate: string,
  active: boolean,
) =>
  recurringRuleSchema.parse({
    id,
    desc,
    amount,
    freq,
    cat,
    acc,
    startDate,
    active,
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  });

const recurringRules = [
  recurringRuleInput('r1', 'Salary — Studio Nord', 340_000, 'Monthly', 'c-sal', 'a1', '2026-09-18', true),
  recurringRuleInput('r2', 'Rent', -128_000, 'Monthly', 'c-rnt', 'a1', '2026-09-18', true),
  recurringRuleInput('r3', 'Spotify Family', -1_099, 'Monthly', 'c-sub', 'a1', '2026-09-30', true),
  recurringRuleInput('r4', 'Netflix', -1_349, 'Monthly', 'c-sub', 'a1', '2026-09-12', true),
  recurringRuleInput('r5', 'Gym — Basic Fit', -2_990, 'Monthly', 'c-hlt', 'a1', '2026-09-21', false),
];

export const mockSeed: MemoryGatewaySeed = {
  workspaceSettings,
  account: accounts,
  category: categories,
  transaction: transactions,
  recurringRule: recurringRules,
  exchangeRate: [],
  investment: [],
  investmentValueSnapshot: [],
};
