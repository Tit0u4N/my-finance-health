// @repo/data — level 1.
// Every entity is keyed by `id` except ExchangeRate, which is keyed by `currency`
// (domain-model.md: "acts as the record's key — one current rate per currency, not a history").
// This is the one place that distinction is handled, so gateways stay uniform above it.
//
// Deliberately non-generic: `entity` and `record` always correspond to the same family at every
// call site, but TypeScript cannot express that correlation once either has been widened to the
// full EntityName union (e.g. after a for-of loop or a discriminated-union member with a
// defaulted type parameter) — so both parameters are typed as the loose, always-valid union, and
// the runtime `entity === 'exchangeRate'` check picks the right shape.

import type { EntityName, EntityRecordMap } from './entityName';

export function recordKeyOf(entity: EntityName, record: EntityRecordMap[EntityName]): string {
  if (entity === 'exchangeRate') {
    return (record as EntityRecordMap['exchangeRate']).currency;
  }
  return (record as { readonly id: string }).id;
}
