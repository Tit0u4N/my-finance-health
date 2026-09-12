// @repo/data — level 1.
// `recordValueSnapshot` batches the snapshot write with the Investment.current update — one
// fact, two rows (domain-model.md). Everything else is plain CRUD.

import type { CreateInvestmentInput, InvestmentPatch } from '@repo/domain/entities/investment';
import { createInvestmentInputSchema, investmentPatchSchema, investmentSchema } from '@repo/domain/entities/investment';
import { investmentValueSnapshotSchema } from '@repo/domain/entities/investmentValueSnapshot';
import { compareIsoDateTime } from '@repo/domain/primitives/dateTime';
import type { InvestmentId } from '@repo/domain/primitives/entityId';
import { isErr, ok } from '@repo/domain/primitives/result';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { InvestmentRepository, RecordValueSnapshotInput } from '@repo/domain/repositories/investmentRepository';
import { rangeFor } from '@repo/domain/time/workspaceTime';
import type { GatewayOperation } from '../gateway/gateway';
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
          // dateRange bounds are IsoDate ('2026-09-12'), compared lexicographically against a
          // snapshot's IsoDateTime ('2026-09-12T09:00:00.000Z') — widened to day boundaries here
          // or a same-day snapshot sorts *after* `end` and is silently dropped from every range.
          dateRange: {
            ...(dateRange.start === undefined ? {} : { start: `${dateRange.start}T00:00:00.000Z` }),
            end: `${dateRange.end}T23:59:59.999Z`,
          },
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
      const latestExisting = await gateway.readCollection('investmentValueSnapshot', {
        filter: { investmentId: id },
        sort: { key: 'date', direction: 'desc' },
        limit: 1,
      });
      if (isErr(latestExisting)) {
        return latestExisting;
      }
      const now = clock.now();
      const record = investmentValueSnapshotSchema.parse({
        ...parsedInput.value,
        id: random.uuid(),
        investmentId: id,
        createdAt: now,
        updatedAt: now,
      });

      // Recording a snapshot only advances Investment.current when it's the newest one on
      // record — a backdated entry (a forgotten price logged after the fact) must not overwrite
      // a more recent price with a stale one.
      const [latest] = latestExisting.value;
      const isNewest = latest === undefined || compareIsoDateTime(record.date, latest.date) >= 0;
      const operations: GatewayOperation[] = [{ kind: 'write', entity: 'investmentValueSnapshot', record }];
      if (isNewest) {
        const updatedInvestment = investmentSchema.parse({
          ...investment.value,
          current: record.price,
          updatedAt: now,
        });
        operations.push({ kind: 'write', entity: 'investment', record: updatedInvestment });
      }

      const batchResult = await gateway.batch(operations);
      return isErr(batchResult) ? batchResult : ok(record);
    },

    delete: async (id: InvestmentId) => {
      const snapshots = await gateway.readCollection('investmentValueSnapshot', { filter: { investmentId: id } });
      if (isErr(snapshots)) {
        return snapshots;
      }
      const operations: GatewayOperation[] = [
        { kind: 'delete', entity: 'investment', id },
        ...snapshots.value.map(
          (snapshot): GatewayOperation => ({ kind: 'delete', entity: 'investmentValueSnapshot', id: snapshot.id }),
        ),
      ];
      const batchResult = await gateway.batch(operations);
      return isErr(batchResult) ? batchResult : ok(true as const);
    },
  };
}
