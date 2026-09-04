// @repo/domain — level 0.
// Interface only. `recordValueSnapshot` takes the investment id separately from the snapshot
// draft (repository-contracts.md's literal signature) — the draft omits `investmentId` since
// the id parameter already supplies it, so the two can never disagree.

import type { CreateInvestmentInput, Investment, InvestmentPatch } from '../entities/investment';
import type { InvestmentValueSnapshot, RecordInvestmentValueSnapshotInput } from '../entities/investmentValueSnapshot';
import type { IsoDateTime } from '../primitives/dateTime';
import type { InvestmentId } from '../primitives/entityId';
import type { DomainError } from '../primitives/errors';
import type { Money } from '../primitives/money';
import type { Result } from '../primitives/result';
import type { HistoryRange } from './criteria';

export type InvestmentValuePoint = { readonly date: IsoDateTime; readonly price: Money };

export type RecordValueSnapshotInput = Omit<RecordInvestmentValueSnapshotInput, 'investmentId'>;

export type InvestmentRepository = {
  list(): Promise<Result<readonly Investment[], DomainError>>;
  getById(id: InvestmentId): Promise<Result<Investment, DomainError>>;
  create(input: CreateInvestmentInput): Promise<Result<Investment, DomainError>>;
  update(id: InvestmentId, patch: InvestmentPatch): Promise<Result<Investment, DomainError>>;
  getValueHistory(id: InvestmentId, range: HistoryRange): Promise<Result<readonly InvestmentValuePoint[], DomainError>>;
  /** Also updates Investment.current to the same price — one fact, two rows (domain-model.md). */
  recordValueSnapshot(
    id: InvestmentId,
    snapshot: RecordValueSnapshotInput,
  ): Promise<Result<InvestmentValueSnapshot, DomainError>>;
};
