import { useColor } from '@/theme/useColor';
import type { LandingFeature, LandingPageProps } from '@/ui/LandingPage';

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
    description: 'The same domain, data access, and state as the desktop and browser builds.',
  },
  {
    id: 'sealed-data',
    title: 'Sealed data',
    description: 'Encrypted database, sealed journal, secret held by the system keychain.',
  },
];

/**
 * ViewModel of the landing route. It lives outside `src/app` on purpose: Expo Router turns every file under
 * that directory into a route, so only route files may sit there.
 */
export function useLandingScreen(): LandingPageProps {
  const { scheme, toggleScheme } = useColor();
  const isDarkTheme = scheme === 'dark';

  return {
    productName: 'my finance health',
    targetLabel: 'Mobile',
    tagline: 'Your accounts, under control.',
    description:
      'The mobile build imports its workspace into the app storage: systems sandbox files, so the database lives in the app-reserved directory and leaves through an explicit export.',
    features,
    primaryActionLabel: isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
    onPrimaryAction: toggleScheme,
    footnote: 'Local mode arrives with the Expo platform adapter.',
  };
}
