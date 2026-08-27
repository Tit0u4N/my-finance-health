import type { LandingFeature, LandingPageProps } from '@repo/ui/components/LandingPage';
import { useState } from 'react';

// Landing copy lives in the app while @repo/i18n is empty; it moves to the translation resources at step 7.
const features: readonly LandingFeature[] = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    description: 'One data set, one storage mode chosen at creation and kept for good.',
  },
  {
    id: 'shared-core',
    title: 'Shared core',
    description: 'Domain, data access, and state written once for the three targets.',
  },
  {
    id: 'sealed-data',
    title: 'Sealed data',
    description: 'Database and operations journal encrypted at rest, never in the clear on disk.',
  },
];

export function useApp(): LandingPageProps {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const handleThemeToggle = (): void => {
    const nextIsDarkTheme = !isDarkTheme;

    document.documentElement.classList.toggle('dark', nextIsDarkTheme);
    setIsDarkTheme(nextIsDarkTheme);
  };

  return {
    productName: 'my finance health',
    targetLabel: 'Web',
    tagline: 'Your accounts, under control.',
    description:
      'The browser build runs online workspaces: the data lives on the API you point it at, the rules stay in the shared core.',
    features,
    primaryActionLabel: isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
    onPrimaryAction: handleThemeToggle,
    footnote: 'Local workspaces need a file system: desktop or mobile.',
  };
}
