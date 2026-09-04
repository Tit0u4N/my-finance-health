// @repo/data — level 1.
// `recordValueSnapshot` batches the snapshot write with the Investment.current update — one
// fact, two rows (domain-model.md). Everything else is plain CRUD.

import type { CreateInvestmentInput, InvestmentPatch } from '@repo/domain/entities/investment';
import { createInvestmentInputSchema, investmentPatchSchema, investmentSchema } from '@repo/domain/entities/investment';
import { investmentValueSnapshotSchema } from '@repo/domain/entities/investmentValueSnapshot';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { isErr, ok } from '@repo/domain/primitives/result';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentRepository, RecordValueSnapshotInput } from '@repo/domain/repositories/investmentRepository';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import { nowIso, parseInput, type RepositoryDepsWithTimezone } from './shared';

// The draft a caller supplies to recordValueSnapshot: everything InvestmentValueSnapshot needs
// except the id, the investmentId (supplied separately, see @repo/domain's
// RecordValueSnapshotInput), and the audit fields (stamped here).
const recordValueSnapshotDraftSchema = investmentValueSnapshotSchema
  .omit({ id: true, investmentId: true, createdAt: true, updatedAt: true })
  .strict();

export function createInvestmentRepository({
  gateway,
  clock,
  random,
  timezone,
}: RepositoryDepsWithTimezone): InvestmentRepository {
  return {
    list: async () => gateway.readCollection('investment', {}),

    getById: async (id: InvestmentId) => gateway.readById('investment', id),

    create: (input: CreateInvestmentInput) => {
      const parsedInput = parseInput(createInvestmentInputSchema, input);
      if (isErr(parsedInput)) {
        return Promise.resolve(parsedInput);
      }
      const now = clock.now();
      const record = investmentSchema.parse({
        ...parsedInput.value,
        id: random.uuid(),
        createdAt: now,
        updatedAt: now,
      });
      return gateway.write('investment', record);
    },

    update: async (id: InvestmentId, patch: InvestmentPatch) => {
      const parsedPatch = parseInput(investmentPatchSchema, patch);
      if (isErr(parsedPatch)) {
        return parsedPatch;
      }
      const current = await gateway.readById('investment', id);
      if (isErr(current)) {
        return current;
      }
      const updated = investmentSchema.parse({ ...current.value, ...parsedPatch.value, updatedAt: clock.now() });
      return gateway.write('investment', updated);
    },

    getValueHistory: async (id: InvestmentId, range: HistoryRange) => {
      const dateRange = rangeFor(range, nowIso(clock), timezone);
      const snapshots = await gateway.readCollection('investmentValueSnapshot', {
        filter: {
          investmentId: id,
          dateRange: { ...(dateRange.start === undefined ? {} : { start: dateRange.start }), end: dateRange.end },
        },
        sort: { key: 'date', direction: 'asc' },
      });
      if (isErr(snapshots)) {
        return snapshots;
      }
      return ok(snapshots.value.map((snapshot) => ({ date: snapshot.date, price: snapshot.price })));
    },

    recordValueSnapshot: async (id: InvestmentId, snapshot: RecordValueSnapshotInput) => {
      const parsedInput = parseInput(recordValueSnapshotDraftSchema, snapshot);
      if (isErr(parsedInput)) {
        return parsedInput;
      }
      const investment = await gateway.readById('investment', id);
      if (isErr(investment)) {
        return investment;
      }
      const now = clock.now();
      const record = investmentValueSnapshotSchema.parse({
        ...parsedInput.value,
        id: random.uuid(),
        investmentId: id,
        createdAt: now,
        updatedAt: now,
      });
      const updatedInvestment = investmentSchema.parse({ ...investment.value, current: record.price, updatedAt: now });

      const batchResult = await gateway.batch([
        { kind: 'write', entity: 'investmentValueSnapshot', record },
        { kind: 'write', entity: 'investment', record: updatedInvestment },
      ]);
      return isErr(batchResult) ? batchResult : ok(record);
    },
  };
}
