// @repo/i18n — level 1.
// French `settings` namespace — see locales/en/settings.ts for the key contract each key must match.

const settings = {
  layout: {
    title: 'Paramètres',
    subtitle: 'Préférences locales · rien ne quitte cette machine',
  },
  nav: {
    preferences: { label: 'Préférences', sub: 'Thème, devise, disposition' },
    categories: { label: 'Catégories', sub: 'Revenus et dépenses' },
    database: { label: 'Base de données', sub: 'Fichier, sauvegardes, export' },
    about: { label: 'À propos', sub: 'Version et crédits' },
  },
  preferences: {
    appearancePanel: {
      title: 'Apparence',
      subtitle: "S'applique instantanément dans toute l'application",
    },
    regionalPanel: {
      title: 'Régional',
    },
    theme: {
      label: 'Thème',
      description: 'Clair, sombre ou selon le système',
      options: {
        light: 'Clair',
        dark: 'Sombre',
        system: 'Automatique',
      },
    },
    sidebar: {
      label: 'Barre latérale',
      description: 'Libellés complets ou icônes seules',
      options: {
        expanded: 'Développée',
        collapsed: 'Icônes seules',
      },
    },
    language: {
      label: 'Langue',
      description: "Langue utilisée dans toute l'application",
      options: {
        system: 'Système',
      },
    },
    baseCurrency: {
      label: 'Devise de référence',
      description: 'Devise affichée pour les totaux multi-comptes',
    },
    exchangeRates: {
      label: 'Taux de change',
      description: '1 unité de cette devise équivaut à ce nombre d’unités de {{baseCurrency}}',
      missingRateError: 'Aucun taux défini — les totaux traitent cette devise au pair (1:1).',
      emptyTitle: 'Aucune autre devise',
      emptySubtitle: 'Ajoutez un compte dans une autre devise et son taux apparaîtra ici.',
    },
  },
  categories: {
    addButton: 'Ajouter',
    dialog: {
      createTitle: 'Nouvelle catégorie',
      editTitle: 'Modifier la catégorie',
      createSubmit: 'Créer la catégorie',
      nameLabel: 'Nom',
      namePlaceholder: 'ex. Courses',
      colourLabel: 'Couleur',
      colourAriaLabel: 'Couleur de la catégorie',
    },
    deleteDialog: {
      title: 'Supprimer « {{name}} » ?',
      noTransactions: "Cette catégorie n'a aucune transaction pour le moment.",
    },
    usageWarning_one: '{{count}} transaction utilise cette catégorie.',
    usageWarning_other: '{{count}} transactions utilisent cette catégorie.',
    countLabel_one: '{{count}} catégorie',
    countLabel_other: '{{count}} catégories',
    errorCouldNotCreate: 'Impossible de créer la catégorie.',
  },
  database: {
    activeFilePanel: {
      title: 'Fichier actif',
      subtitle: 'Tout est stocké dans ce fichier unique',
    },
    metadata: {
      size: 'Taille',
      lastOpened: 'Dernière ouverture',
      rows: 'Lignes',
    },
    notAvailableYet: 'Pas encore disponible',
    actions: {
      switchFile: 'Changer de fichier',
      createBackup: 'Créer une sauvegarde',
    },
    dangerZonePanel: {
      title: 'Zone à risque',
      subtitle: 'Ces actions sont irréversibles',
    },
    resetAllData: {
      label: 'Réinitialiser toutes les données',
      description: 'Efface les transactions, comptes et investissements. Le fichier lui-même reste sur le disque.',
    },
    resetEverything: 'Tout réinitialiser',
    emptyState: {
      title: 'Non disponible sur cette plateforme',
      subtitle: 'La gestion de la base de données nécessite un accès aux fichiers locaux, absent de cette version.',
    },
  },
  about: {
    panelTitle: 'À propos',
    panelSubtitle: 'My Finance Health pour ordinateur',
    version: 'Version {{version}} · Build local',
    encryptedAtRest: 'Chiffré au repos',
    facts: {
      storage: { label: 'Stockage', value: 'SQLite, sur cette machine' },
      sync: { label: 'Synchronisation', value: 'Aucune — par conception' },
      telemetry: { label: 'Télémétrie', value: 'Aucune' },
    },
  },
} as const;

export default settings;
