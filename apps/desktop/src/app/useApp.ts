import type { LandingFeature, LandingPageProps } from '@repo/ui/components/LandingPage';
import { useState } from 'react';

// Landing copy lives in the app while @repo/i18n is empty; it moves to the translation resources at step 7.
const features: readonly LandingFeature[] = [
  {
    id: 'workspaces',
    title: 'Workspaces',
    description: 'Local file or remote API, the mode is picked at creation and never changes.',
  },
  {
    id: 'shared-core',
    title: 'Shared core',
    description: 'The same domain, data access, and state as the browser build.',
  },
  {
    id: 'sealed-data',
    title: 'Sealed data',
    description: 'Encrypted database, sealed journal, secret held by the system keyring.',
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
    targetLabel: 'Desktop',
    tagline: 'Your accounts, under control.',
    description:
      'The desktop build adds local workspaces: an encrypted file you place where you want, opened by the same shared core.',
    features,
    primaryActionLabel: isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
    onPrimaryAction: handleThemeToggle,
    footnote: 'Local mode arrives with the Tauri platform adapter.',
  };
}
