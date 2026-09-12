// @repo/i18n — level 1.
// The `overview` namespace — Overview (dashboard) (screens.md).

const overview = {
  title: 'Overview',
  subtitle: '{{inScope}} of {{total}} accounts in scope',
  kpi: {
    balance: 'Total balance',
    balanceSub_one: '{{count}} account · {{currency}}',
    balanceSub_other: '{{count}} accounts · {{currency}}',
    income: 'Income · {{month}}',
    spending: 'Spending · {{month}}',
    thisMonth: 'this month',
    net: 'Net saved',
    netRate: '{{percent}}% rate',
    ofIncomeKept: 'of income kept',
  },
  cashflow: {
    panelTitle: 'Cashflow',
    panelSubtitle: 'How this month moved through your money',
    savings: 'Savings',
  },
  breakdown: {
    panelTitle: 'Spending breakdown',
    panelSubtitle_one: '{{count}} category this month',
    panelSubtitle_other: '{{count}} categories this month',
    centerLabel: 'Spent',
  },
  accounts: {
    panelTitle: 'Accounts',
    panelSubtitle: '{{count}} in scope',
    upcomingLabel: 'Upcoming',
  },
  activity: {
    panelTitle: 'Recent activity',
    countLabel_one: '{{count}} transaction this month',
    countLabel_other: '{{count}} transactions this month',
    accountColumn: 'Account',
  },
} as const;

export default overview;
