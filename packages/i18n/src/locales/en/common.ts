// @repo/i18n — level 1.
// The `common` namespace: vocabulary shared by two or more screens — generic actions, loading and
// not-found states, the app's nav labels, and the domain enum → display-label lookups (account
// type, recurring frequency, category kind) that every screen using them must resolve identically.

const common = {
  action: {
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    exportCsv: 'Export CSV',
    showAmounts: 'Show amounts',
    hideAmounts: 'Hide amounts',
  },
  state: {
    loading: 'Loading…',
    loadingWorkspace: 'Loading your workspace…',
    notFound: 'Not found',
  },
  error: {
    couldNotSaveChanges: 'Could not save the changes. Try again.',
  },
  nav: {
    overview: 'Overview',
    transactions: 'Transactions',
    recurring: 'Recurring',
    investments: 'Investments',
    accounts: 'Accounts',
    settings: 'Settings',
  },
  accountType: {
    Checking: 'Checking',
    Savings: 'Savings',
    Investment: 'Investment',
    Cash: 'Cash',
  },
  recurringFrequency: {
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Yearly: 'Yearly',
  },
  categoryKind: {
    income: 'Income',
    expense: 'Expense',
  },
  category: {
    other: 'Other',
  },
  brand: {
    name: 'My Finance Health',
  },
  historyRange: {
    all: 'All',
  },
  accountFilter: {
    allAccounts: 'All accounts',
    groupLabel: 'Accounts',
    selectAll: 'Select all',
    count_one: '{{count}} account',
    count_other: '{{count}} accounts',
  },
  label: {
    historyRange: 'History range',
  },
  column: {
    description: 'Description',
    category: 'Category',
    date: 'Date',
    amount: 'Amount',
  },
  kpi: {
    inflow: 'Inflow',
    outflow: 'Outflow',
    net: 'Net',
  },
  datePicker: {
    placeholder: 'Pick a date',
    openCalendar: 'Open calendar',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
} as const;

export default common;
