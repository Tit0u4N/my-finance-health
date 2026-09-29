import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRoot } from '@/root/AppRoot';
import { ThemedStatusBar } from '@/theme/ThemedStatusBar';
import { ThemeProvider } from '@/theme/ThemeProvider';

// `_layout` is imposed by Expo Router, which also requires a default export from every route file.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AppRoot>
          <Stack screenOptions={{ headerShown: false }} />
        </AppRoot>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
