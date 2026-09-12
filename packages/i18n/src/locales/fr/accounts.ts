// @repo/i18n — level 1.
// French `accounts` namespace — see locales/en/accounts.ts for the key contract each key must match.

const accounts = {
  list: {
    title: 'Comptes',
    subtitle_one: '{{count}} compte · {{total}} au total',
    subtitle_other: '{{count}} comptes · {{total}} au total',
    subtitleMissingRate: ' (taux manquants)',
    addAccount: 'Ajouter un compte',
    addAnother: 'Ajouter un autre compte',
    changeCaption: 'le mois dernier',
  },
  createDialog: {
    title: 'Nouveau compte',
    subtitle: 'Les soldes se mettent à jour au fil des transactions',
    submit: 'Créer le compte',
    nameLabel: 'Nom',
    namePlaceholder: 'ex. Quotidien',
    typeLabel: 'Type',
    typeAriaLabel: 'Type de compte',
    initialBalanceLabel: 'Solde initial',
    currencyLabel: 'Devise',
    errorCheckDetails: 'Vérifiez les informations du compte et réessayez.',
    errorCouldNotCreate: 'Impossible de créer le compte. Réessayez.',
  },
  editDialog: {
    title: 'Modifier le compte',
    colourLabel: 'Couleur',
    colourAriaLabel: 'Couleur du compte',
  },
  detail: {
    edit: 'Modifier',
    exportCsv: 'Exporter en CSV',
    balanceTrendTitle: 'Évolution du solde',
    pastPeriod7d: 'Les 7 derniers jours',
    pastPeriodMonth: 'Le mois dernier',
    pastPeriodOther: 'La période précédente',
    transactionsPanelTitle: 'Transactions',
    filter: 'Filtrer',
    rowCount: '{{count}} sur ce compte',
    emptyTitle: 'Aucune transaction pour le moment',
    emptySubtitle: "L'activité de ce compte apparaîtra ici.",
    eyebrow: 'Comptes · {{type}}',
    subtitleWithLast4: 'Se terminant par {{last4}} · {{currency}}',
    kpi: {
      balance: 'Solde actuel',
      balanceSub_one: '{{count}} transaction',
      balanceSub_other: '{{count}} transactions',
      allRecorded: 'total enregistré',
      netEntries: '{{count}} écritures',
    },
  },
} as const;

export default accounts;
