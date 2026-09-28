import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRoot } from '@/root/AppRoot';
import { ThemeProvider } from '@/theme/ThemeProvider';

// `_layout` is imposed by Expo Router, which also requires a default export from every route file.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <AppRoot>
          <Stack screenOptions={{ headerShown: false }} />
        </AppRoot>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
