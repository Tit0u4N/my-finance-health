// @repo/app-core — level 2.
// The New/Edit transaction dialog's description Autocomplete (app-core-inventory.md §6):
// distinct past descriptions, most recent spelling wins, ranked by fuzzy match against the query.

import type { Transaction } from '@repo/domain/entities/transaction';
import { compareIsoDateTime } from '@repo/domain/primitives/dateTime';
import Fuse from 'fuse.js';

const DEFAULT_LIMIT = 8;

/** One entry per distinct `desc` (case-insensitively), a small list — one Fuse index per call is
 * cheap and keeps this a pure function with no cache to invalidate. */
export function computeDescSuggestions(
  transactions: readonly Transaction[],
  query: string,
  limit: number = DEFAULT_LIMIT,
): readonly string[] {
  const byRecency = [...transactions].sort((a, b) => compareIsoDateTime(b.date, a.date));
  const seen = new Set<string>();
  const names: string[] = [];
  for (const transaction of byRecency) {
    const key = transaction.desc.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      names.push(transaction.desc);
    }
  }

  const trimmed = query.trim();
  if (trimmed === '') {
    return names.slice(0, limit);
  }

  const fuse = new Fuse(names, { threshold: 0.4, ignoreLocation: true });
  return fuse
    .search(trimmed)
    .slice(0, limit)
    .map((result) => result.item);
}
