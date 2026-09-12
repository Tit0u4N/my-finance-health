// @repo/i18n — level 1.
// The `accounts` namespace — Accounts (list) and Account detail (screens.md).

const accounts = {
  list: {
    title: 'Accounts',
    subtitle_one: '{{count}} account · {{total}} total',
    subtitle_other: '{{count}} accounts · {{total}} total',
    subtitleMissingRate: ' (some rates missing)',
    addAccount: 'Add account',
    addAnother: 'Add another account',
    changeCaption: 'past month',
  },
  createDialog: {
    title: 'New account',
    subtitle: 'Balances update as you record transactions',
    submit: 'Create account',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Everyday',
    typeLabel: 'Type',
    typeAriaLabel: 'Account type',
    initialBalanceLabel: 'Initial balance',
    currencyLabel: 'Currency',
    errorCheckDetails: 'Check the account details and try again.',
    errorCouldNotCreate: 'Could not create the account. Try again.',
  },
  editDialog: {
    title: 'Edit account',
    colourLabel: 'Colour',
    colourAriaLabel: 'Account colour',
  },
  detail: {
    edit: 'Edit',
    exportCsv: 'Export CSV',
    balanceTrendTitle: 'Balance trend',
    // Only 7d and 1m get their own words — 3m/1y/all all read "Past period" (RANGE_CAPTION's
    // original shape: a HistoryRange → one of these three, never a HistoryRange → unique string).
    pastPeriod7d: 'Past 7 days',
    pastPeriodMonth: 'Past month',
    pastPeriodOther: 'Past period',
    transactionsPanelTitle: 'Transactions',
    filter: 'Filter',
    rowCount: '{{count}} on this account',
    emptyTitle: 'No transactions yet',
    emptySubtitle: 'Activity on this account will show up here.',
    eyebrow: 'Accounts · {{type}}',
    subtitleWithLast4: 'Ending in {{last4}} · {{currency}}',
    kpi: {
      balance: 'Current balance',
      balanceSub_one: '{{count}} transaction',
      balanceSub_other: '{{count}} transactions',
      allRecorded: 'all recorded',
      netEntries: '{{count}} entries',
    },
  },
} as const;

export default accounts;
