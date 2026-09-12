// @repo/routes — level 3.
// Presentation labels for HistoryRange, kept out of @repo/ui's RangePicker (which stays generic
// over TValue and never learns the word "HistoryRange" — ui-inventory.md §2).

import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { RangePickerOption } from '@repo/ui/components/RangePicker';

export const HISTORY_RANGE_OPTIONS: readonly RangePickerOption<HistoryRange>[] = [
  { value: '7d', label: '7d' },
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '1y', label: '1y' },
  { value: 'all', label: 'All' },
];
