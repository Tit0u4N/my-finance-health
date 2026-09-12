// Temporary mock data — deleted whole-cloth once real bootstrap/workspace opening lands (see
// createMockWorkspace.ts). Ported from the Claude Design mock's `data.js`: same accounts,
// categories, and transactions, translated to the real domain shapes — cents instead of floats
// (open-questions.md #1), no `type` field on Transaction/RecurringRule (open-questions.md #6),
// `startDate` instead of a stored `next` (open-questions.md #7). Every record is built through the
// entity's own zod schema, the same construction path a repository `create` call would take.

import { accountSchema } from '@repo/domain/entities/account';
import { categorySchema } from '@repo/domain/entities/category';
import { investmentSchema } from '@repo/domain/entities/investment';
import type { InvestmentValueSnapshot } from '@repo/domain/entities/investmentValueSnapshot';
import { investmentValueSnapshotSchema } from '@repo/domain/entities/investmentValueSnapshot';
import { recurringRuleSchema } from '@repo/domain/entities/recurringRule';
import { transactionSchema } from '@repo/domain/entities/transaction';
import { workspaceSettingsSchema } from '@repo/domain/entities/workspaceSettings';
import type { MemoryGatewaySeed } from '../gateway/memoryGateway';
import { WORKSPACE_SETTINGS_ID } from '../repositories/workspaceSettingsRepository';

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

const investmentInput = (
  id: string,
  name: string,
  ticker: string,
  qty: number,
  avg: number,
  current: number,
  color: string,
) =>
  investmentSchema.parse({
    id,
    name,
    ticker,
    qty,
    avg,
    current,
    color,
    createdAt: AUDIT_TIMESTAMP,
    updatedAt: AUDIT_TIMESTAMP,
  });

// [offset from MOCK_NOW in days, per-unit price in minor units]. Every series shares the same
// offsets so 7d/1m/3m/1y/all each return a visibly different slice rather than collapsing to the
// same handful of points; offset 0's price must equal the position's own `current` above.
type PricePoint = readonly [offset: number, price: number];
const SNAPSHOT_OFFSETS: readonly number[] = [
  -365, -180, -90, -60, -45, -28, -21, -14, -10, -7, -6, -5, -4, -3, -2, -1, 0,
];

function snapshotSeries(investmentId: string, prices: readonly number[]): InvestmentValueSnapshot[] {
  const points: PricePoint[] = SNAPSHOT_OFFSETS.map((offset, index) => [offset, prices[index] as number]);
  return points.map(([offset, price], index) =>
    investmentValueSnapshotSchema.parse({
      id: `${investmentId}-s${index}`,
      investmentId,
      date: daysFromAnchor(offset),
      price,
      createdAt: AUDIT_TIMESTAMP,
      updatedAt: AUDIT_TIMESTAMP,
    }),
  );
}

// Fractional qty (open-questions.md #1: "not a minor-unit money field, fractional units are
// plausible") — a rising position.
const i1Prices = [
  15_200, 16_500, 18_700, 19_500, 20_100, 20_800, 21_000, 21_200, 21_300, 21_350, 21_370, 21_390, 21_400, 21_410,
  21_420, 21_430, 21_450,
];
const i2Prices = [
  4_200, 4_600, 5_000, 5_300, 5_450, 5_600, 5_650, 5_700, 5_720, 5_740, 5_745, 5_750, 5_755, 5_760, 5_765, 5_770, 5_780,
];
// Deliberately loss-making: current (82.50) sits below avg cost (90.00).
const i3Prices = [
  9_800, 9_600, 9_200, 9_000, 8_800, 8_600, 8_500, 8_400, 8_350, 8_320, 8_310, 8_300, 8_290, 8_280, 8_270, 8_260, 8_250,
];
const i4Prices = [
  5_800, 6_000, 6_200, 6_300, 6_350, 6_420, 6_450, 6_480, 6_500, 6_510, 6_515, 6_520, 6_525, 6_530, 6_535, 6_540, 6_550,
];

const investments = [
  investmentInput('i1', 'World ETF (CW8)', 'CW8', 12.5, 18_000, i1Prices[i1Prices.length - 1] as number, '#3B82F6'),
  investmentInput('i2', 'Tech Growth Fund', 'TGF', 40, 5_200, i2Prices[i2Prices.length - 1] as number, '#8B5CF6'),
  investmentInput('i3', 'Emerging Markets ETF', 'EMEM', 25, 9_000, i3Prices[i3Prices.length - 1] as number, '#EF4444'),
  investmentInput('i4', 'Gold ETC', 'GLDE', 18, 6_500, i4Prices[i4Prices.length - 1] as number, '#F59E0B'),
];

const investmentValueSnapshots = [
  ...snapshotSeries('i1', i1Prices),
  ...snapshotSeries('i2', i2Prices),
  ...snapshotSeries('i3', i3Prices),
  ...snapshotSeries('i4', i4Prices),
];

export const mockSeed: MemoryGatewaySeed = {
  workspaceSettings,
  account: accounts,
  category: categories,
  transaction: transactions,
  recurringRule: recurringRules,
  exchangeRate: [],
  investment: investments,
  investmentValueSnapshot: investmentValueSnapshots,
};
