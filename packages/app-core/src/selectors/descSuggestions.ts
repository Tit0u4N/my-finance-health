// @repo/app-core — level 2.
// The New/Edit transaction dialog's description Autocomplete (app-core-inventory.md §6):
// distinct past descriptions, most recent spelling wins, ranked by fuzzy match against the query.

import type { Transaction } from '@repo/domain/entities/transaction';
import { compareIsoDateTime } from '@repo/domain/primitives/dateTime';
import Fuse from 'fuse.js';

const DEFAULT_LIMIT = 8;

/** What an empty query suggests: the most recently used descriptions (default, desktop) or the
 * most frequently used ones, ties broken by recency (mobile — a short "your usual" row). */
export type EmptyQueryRanking = 'recent' | 'frequent';

/** One entry per distinct `desc` (case-insensitively), a small list — one Fuse index per call is
 * cheap and keeps this a pure function with no cache to invalidate. */
export function computeDescSuggestions(
  transactions: readonly Transaction[],
  query: string,
  limit: number = DEFAULT_LIMIT,
  emptyQueryRanking: EmptyQueryRanking = 'recent',
): readonly string[] {
  const byRecency = [...transactions].sort((a, b) => compareIsoDateTime(b.date, a.date));
  const counts = new Map<string, number>();
  const names: string[] = [];
  for (const transaction of byRecency) {
    const key = transaction.desc.toLowerCase();
    const count = counts.get(key);
    if (count === undefined) {
      names.push(transaction.desc);
    }
    counts.set(key, (count ?? 0) + 1);
  }

  const trimmed = query.trim();
  if (trimmed === '') {
    // `Array.prototype.sort` is stable, so equal counts keep their most-recent-first order.
    const ranked =
      emptyQueryRanking === 'frequent'
        ? [...names].sort((a, b) => (counts.get(b.toLowerCase()) ?? 0) - (counts.get(a.toLowerCase()) ?? 0))
        : names;
    return ranked.slice(0, limit);
  }

  const fuse = new Fuse(names, { threshold: 0.4, ignoreLocation: true });
  return fuse
    .search(trimmed)
    .slice(0, limit)
    .map((result) => result.item);
}
