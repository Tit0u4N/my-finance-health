// @repo/domain — level 0.
// One branded id type per entity family, so an AccountId can never be passed where a CategoryId
// is expected even though both are plain strings at runtime. Every entity carries a
// client-generated id from its first schema version (start-roadmap.md §17).

import { z } from 'zod';

const brandedId = <Name extends string>(_name: Name) => z.string().min(1).brand<Name>();

export const workspaceSettingsIdSchema = brandedId('WorkspaceSettingsId');
export type WorkspaceSettingsId = z.infer<typeof workspaceSettingsIdSchema>;

export const accountIdSchema = brandedId('AccountId');
export type AccountId = z.infer<typeof accountIdSchema>;

export const categoryIdSchema = brandedId('CategoryId');
export type CategoryId = z.infer<typeof categoryIdSchema>;

export const transactionIdSchema = brandedId('TransactionId');
export type TransactionId = z.infer<typeof transactionIdSchema>;

export const recurringRuleIdSchema = brandedId('RecurringRuleId');
export type RecurringRuleId = z.infer<typeof recurringRuleIdSchema>;

export const investmentIdSchema = brandedId('InvestmentId');
export type InvestmentId = z.infer<typeof investmentIdSchema>;

export const investmentValueSnapshotIdSchema = brandedId('InvestmentValueSnapshotId');
export type InvestmentValueSnapshotId = z.infer<typeof investmentValueSnapshotIdSchema>;
