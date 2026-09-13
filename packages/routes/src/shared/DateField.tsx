// @repo/routes — level 3.
// Thin wrapper around @repo/ui's DatePicker: the i18n + locale + formatting plumbing (`@repo/ui`
// may import neither) is written once here instead of once per dialog (ui-inventory.md §1).

import { useFormattingLocale } from '@repo/app-core/i18n/useFormattingLocale';
import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { formatAbsoluteDate } from '@repo/app-core/selectors/formatAbsoluteDate';
import type { IsoDate } from '@repo/domain/primitives/dateTime';
import { DatePicker } from '@repo/ui/components/DatePicker';

export type DateFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly error?: string;
};

export function DateField({ label, value, onValueChange, error }: DateFieldProps) {
  const { t } = useTranslation();
  const locale = useFormattingLocale();
  const displayValue = value ? formatAbsoluteDate(value as IsoDate, locale, { withYear: true }) : '';

  return (
    <DatePicker
      label={label}
      value={value}
      onValueChange={onValueChange}
      displayValue={displayValue}
      placeholder={t('common:datePicker.placeholder')}
      locale={locale}
      previousMonthLabel={t('common:datePicker.previousMonth')}
      nextMonthLabel={t('common:datePicker.nextMonth')}
      openCalendarLabel={t('common:datePicker.openCalendar')}
      {...(error === undefined ? {} : { error })}
    />
  );
}
