// App stage root — mirrors apps/desktop/src/app/App.tsx's `MockApp` branch. `_layout.tsx` mounts
// this above every route so screens/*.ts ViewModels can call @repo/app-core's query/mutation
// hooks and selectors unchanged from apps/desktop (docs/start-roadmap.md §5: shared above the
// rendering boundary).

import { AppStageProviders } from '@repo/app-core/providers/AppStageProviders';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeModeSync } from '@/theme/ThemeModeSync';
import { FONT_SIZE, SPACING } from '@/theme/tokens';
import { LocalAppRoot } from './LocalAppRoot';
import { useAppRoot } from './useAppRoot';

const STORAGE_MODE = process.env.EXPO_PUBLIC_STORAGE_MODE ?? 'inMemory';

type AppRootProps = {
  readonly children: ReactNode;
};

// A module-level branch rather than one hook conditionally skipped: MockAppRoot, LocalAppRoot and
// UnsupportedStorageMode each call their own hooks unconditionally, same reasoning as App.tsx's
// own comment. `classic` is the same value desktop uses for its local (encrypted SQLite) mode.
export function AppRoot({ children }: AppRootProps): ReactElement {
  if (STORAGE_MODE === 'inMemory') {
    return <MockAppRoot>{children}</MockAppRoot>;
  }
  if (STORAGE_MODE === 'classic') {
    return <LocalAppRoot>{children}</LocalAppRoot>;
  }
  return <UnsupportedStorageMode mode={STORAGE_MODE} />;
}

function MockAppRoot({ children }: AppRootProps): ReactElement {
  const { platform, repositories, queryClient } = useAppRoot();

  return (
    <AppStageProviders platform={platform} queryClient={queryClient} repositories={repositories}>
      <ThemeModeSync />
      {children}
    </AppStageProviders>
  );
}

// An unrecognised value renders this instead of silently falling back to the fixture workspace.
function UnsupportedStorageMode({ mode }: { readonly mode: string }): ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Unsupported EXPO_PUBLIC_STORAGE_MODE "{mode}". Use "inMemory" or "classic" — see apps/mobile/.env.example.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.gutter,
  },
  text: {
    fontSize: FONT_SIZE.body,
    textAlign: 'center',
  },
});
