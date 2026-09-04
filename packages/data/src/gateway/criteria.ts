// @repo/data — level 1.
// The serializable filter/sort shape both gateways understand (repository-contracts.md:
// "readCollection criteria must express: entity type, filter predicates [...], sort, and — for
// history reads — a range"). Deliberately entity-agnostic: repositories translate their typed
// domain criteria (@repo/domain's TransactionCriteria, HistoryRange, ...) into this shape: it is
// the one gateway-level vocabulary every repository composes, never a per-entity query shape.

export type GatewayFilter = {
  readonly accountIds?: readonly string[];
  readonly categoryId?: string;
  readonly investmentId?: string;
  readonly amountSign?: 'positive' | 'negative';
  /** Matched against `desc`/`note` on the entities that carry them. */
  readonly text?: string;
  /** Inclusive bounds against the entity's `date` field. Either bound may be absent. */
  readonly dateRange?: { readonly start?: string; readonly end?: string };
};

export type GatewaySortKey = 'date' | 'amount';
export type GatewaySort = { readonly key: GatewaySortKey; readonly direction: 'asc' | 'desc' };

export type GatewayCriteria = {
  readonly filter?: GatewayFilter;
  readonly sort?: GatewaySort;
  readonly limit?: number;
};
