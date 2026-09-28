// @repo/i18n — level 1.
// French `common` namespace — see locales/en/common.ts for the key contract each key must match.

const common = {
  action: {
    cancel: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    close: 'Fermer',
    edit: 'Modifier',
    delete: 'Supprimer',
    exportCsv: 'Exporter en CSV',
    showAmounts: 'Afficher les montants',
    hideAmounts: 'Masquer les montants',
  },
  state: {
    loading: 'Chargement…',
    loadingWorkspace: 'Chargement de votre espace…',
    notFound: 'Introuvable',
  },
  error: {
    couldNotSaveChanges: "Impossible d'enregistrer les modifications. Réessayez.",
  },
  nav: {
    overview: "Vue d'ensemble",
    transactions: 'Transactions',
    recurring: 'Récurrent',
    investments: 'Investissements',
    accounts: 'Comptes',
    settings: 'Paramètres',
    // apps/mobile's own tab labels — see locales/en/common.ts for the key contract.
    home: 'Accueil',
    activity: 'Activité',
    invest: 'Investir',
  },
  accountType: {
    Checking: 'Courant',
    Savings: 'Épargne',
    Investment: 'Investissement',
    Cash: 'Espèces',
  },
  recurringFrequency: {
    Daily: 'Quotidienne',
    Weekly: 'Hebdomadaire',
    Monthly: 'Mensuelle',
    Yearly: 'Annuelle',
  },
  categoryKind: {
    income: 'Revenu',
    expense: 'Dépense',
  },
  category: {
    other: 'Autre',
  },
  brand: {
    name: 'My Finance Health',
  },
  historyRange: {
    all: 'Tout',
  },
  accountFilter: {
    allAccounts: 'Tous les comptes',
    groupLabel: 'Comptes',
    selectAll: 'Tout sélectionner',
    count_one: '{{count}} compte',
    count_other: '{{count}} comptes',
  },
  label: {
    historyRange: "Plage d'historique",
  },
  column: {
    description: 'Description',
    category: 'Catégorie',
    date: 'Date',
    amount: 'Montant',
  },
  kpi: {
    inflow: 'Entrées',
    outflow: 'Sorties',
    net: 'Net',
  },
  datePicker: {
    placeholder: 'Choisir une date',
    openCalendar: 'Ouvrir le calendrier',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
  },
} as const;

export default common;
