// @repo/i18n — level 1.
// French `overview` namespace — see locales/en/overview.ts for the key contract each key must match.

const overview = {
  title: "Vue d'ensemble",
  subtitle: '{{inScope}} sur {{total}} comptes dans le périmètre',
  kpi: {
    balance: 'Solde total',
    balanceSub_one: '{{count}} compte · {{currency}}',
    balanceSub_other: '{{count}} comptes · {{currency}}',
    income: 'Revenus · {{month}}',
    spending: 'Dépenses · {{month}}',
    thisMonth: 'ce mois-ci',
    net: 'Épargne nette',
    netRate: '{{percent}} % de taux',
    ofIncomeKept: 'des revenus conservés',
  },
  cashflow: {
    panelTitle: 'Flux financiers',
    panelSubtitle: 'Comment votre argent a circulé ce mois-ci',
    savings: 'Épargne',
  },
  breakdown: {
    panelTitle: 'Répartition des dépenses',
    panelSubtitle_one: '{{count}} catégorie ce mois-ci',
    panelSubtitle_other: '{{count}} catégories ce mois-ci',
    centerLabel: 'Dépensé',
  },
  accounts: {
    panelTitle: 'Comptes',
    panelSubtitle: '{{count}} dans le périmètre',
    upcomingLabel: 'À venir',
  },
  activity: {
    panelTitle: 'Activité récente',
    countLabel_one: '{{count}} transaction ce mois-ci',
    countLabel_other: '{{count}} transactions ce mois-ci',
    accountColumn: 'Compte',
  },
} as const;

export default overview;
