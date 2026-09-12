// @repo/routes — level 3.
// Presentation labels for HistoryRange, kept out of @repo/ui's RangePicker (which stays generic
// over TValue and never learns the word "HistoryRange" — ui-inventory.md §2). A hook, not a
// module-level constant, because "All" is the one label of the five that's actual copy — 7d/1m/3m/1y
// are unit abbreviations, not words, and stay untranslated.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import type { HistoryRange } from '@repo/domain/repositories/criteria';
import type { RangePickerOption } from '@repo/ui/components/RangePicker';

export function useHistoryRangeOptions(): readonly RangePickerOption<HistoryRange>[] {
  const { t } = useTranslation();
  return [
    { value: '7d', label: '7d' },
    { value: '1m', label: '1m' },
    { value: '3m', label: '3m' },
    { value: '1y', label: '1y' },
    { value: 'all', label: t('common:historyRange.all') },
  ];
}
