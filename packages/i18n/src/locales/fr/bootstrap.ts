// @repo/i18n — level 1.
// Espace de noms `bootstrap` : le parcours avant ouverture (choisir / créer / importer /
// déverrouiller un espace de travail), partagé entre desktop et mobile.

const bootstrap = {
  passphrase: {
    tooShort: 'La phrase secrète doit contenir au moins {{min}} caractères.',
    mismatch: 'Les phrases secrètes ne correspondent pas.',
    match: 'Les phrases secrètes correspondent.',
    label: 'Phrase secrète',
    labelWithMin: 'Phrase secrète ({{min}} caractères minimum)',
    confirmLabel: 'Confirmer la phrase secrète',
    warning:
      'Cette phrase secrète déverrouille le fichier à chaque ouverture, sur chaque appareil — notez-la en lieu sûr.',
  },
  error: {
    notFound: 'Ce fichier ne ressemble pas à un espace de travail my finance health.',
    integrity: 'Les fichiers de cet espace de travail sont manquants ou endommagés : {{detail}}',
    unsupportedCapability: "Ce n'est pas un espace de travail local ({{capability}}).",
    tryAgain: 'Réessayer',
    chooseAnother: 'Choisir un autre espace de travail',
    folderPicker: "Impossible d'ouvrir le sélecteur de dossier.",
    filePicker: "Impossible d'ouvrir le sélecteur de fichier.",
    saveDialog: "Impossible d'ouvrir la fenêtre d'enregistrement.",
    prepareCloud:
      "Impossible de préparer un dossier dans iCloud Drive. Vérifiez qu'iCloud Drive est activé, ou gardez l'espace sur cet appareil.",
    prepareDevice: "Impossible de préparer un emplacement pour l'espace de travail sur cet appareil.",
  },
  progress: {
    loading: 'Chargement…',
    migrating: 'Application des mises à jour…',
    replaying: 'Restauration des dernières modifications…',
    opening: 'Ouverture…',
  },
  picker: {
    title: 'my finance health',
    subtitle: 'Vos données restent chiffrées, sur cet appareil ou dans votre iCloud.',
    workspaces: 'Espaces de travail',
    inICloud: 'Dans iCloud Drive',
    recent: 'Récents',
    noRecentTitle: 'Aucun espace de travail récent',
    noRecentSubtitle: 'Ouvrez un fichier existant ou créez-en un nouveau.',
    create: 'Créer un espace de travail',
    import: 'Importer un espace de travail',
    openFile: 'Ouvrir un fichier…',
    createNew: 'Créer…',
  },
  create: {
    title: 'Nouvel espace de travail',
    close: 'Fermer',
    hint: 'Toujours chiffré. Impossible de le récupérer sans la phrase secrète.',
    name: 'Nom',
    location: 'Emplacement',
    locationCloud: 'iCloud Drive',
    locationDevice: 'Cet appareil',
    cloudHint:
      'Conservé dans iCloud Drive › my finance health et synchronisé avec vos autres appareils. Ouvrez-le sur un seul appareil à la fois.',
    deviceHint: 'Conservé uniquement sur cet appareil, dans Fichiers › Sur mon iPhone › my finance health.',
    baseCurrency: 'Devise de base',
    saveCopyTitle: 'Enregistrer une copie dans',
    saveCopyHint:
      "Facultatif. Choisissez un dossier — iCloud Drive, Sur mon iPhone, un autre fournisseur — et une copie y sera enregistrée dès la création de l'espace de travail.",
    saveCopyHintChosen: "Une copie sera enregistrée dans le dossier choisi dès la création de l'espace de travail.",
    chooseFolder: 'Choisir un dossier…',
    chooseAnotherFolder: 'Choisir un autre dossier…',
    noCopy: 'Ne pas enregistrer de copie',
    submit: "Créer l'espace de travail",
    submitDesktop: 'Choisir l’emplacement et créer',
    back: 'Retour',
    createdTitle: 'Espace de travail créé',
    copyFailed:
      'Impossible de le copier dans le dossier choisi. {{detail}} Vous pourrez réessayer depuis Réglages → Données.',
    copyFailedNoDetail:
      'Impossible de le copier dans le dossier choisi. Vous pourrez réessayer depuis Réglages → Données.',
    copySavedTitle: 'Copie enregistrée',
    copySaved: '« {{name}} » a été enregistré dans le dossier choisi.',
  },
  unlock: {
    hint: 'Saisissez la phrase secrète pour déverrouiller cet espace de travail.',
    submit: 'Déverrouiller',
    remember: 'Mémoriser avec {{label}}',
    rememberHere: 'Mémoriser avec {{label}} sur cet appareil',
    unlockWith: 'Déverrouiller avec {{label}}',
    biometricFallback: 'Déverrouillage biométrique',
  },
  import: {
    title: 'Importer un espace de travail',
    hint: "Choisissez le dossier contenant un espace de travail exporté — dans iCloud Drive, Google Drive ou n'importe où dans Fichiers. Une copie est faite sur cet appareil ; l'original n'est pas modifié.",
    chooseFolder: 'Choisir un dossier…',
    found: 'Trouvés',
    nothingFound:
      'Aucun espace de travail dans ce dossier. Choisissez le dossier qui contient directement le fichier .mfhdb.',
    readError: 'Impossible de lire ce dossier.',
  },
  starter: {
    title: 'Choisissez vos catégories',
    hint: 'Cochez celles avec lesquelles démarrer. Vous pourrez les renommer, en ajouter ou en retirer à tout moment dans les Réglages.',
    income: 'Revenus',
    expense: 'Dépenses',
    confirm_one: 'Ajouter {{count}} catégorie',
    confirm_other: 'Ajouter {{count}} catégories',
    confirmNone: 'Continuer sans catégorie',
    skip: 'Passer pour le moment',
    error: "Impossible d'ajouter les catégories. Réessayez.",
    categories: {
      salary: 'Salaire',
      freelance: 'Freelance',
      interest: 'Intérêts',
      refunds: 'Remboursements',
      rent: 'Loyer',
      groceries: 'Courses',
      utilities: 'Factures',
      transport: 'Transports',
      eatingOut: 'Restaurants',
      subscriptions: 'Abonnements',
      health: 'Santé',
      leisure: 'Loisirs',
      shopping: 'Shopping',
      otherExpense: 'Autres',
    },
  },
} as const;

export default bootstrap;
