import { Stack } from 'expo-router';

// `_layout` is imposed by Expo Router, which also requires a default export from every route
// file. `headerShown: false` does not inherit from the parent `(tabs)` Stack/Tabs — each nested
// Stack must restate it, or a pushed sub-screen gains a native header above its own header row.
export default function SettingsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
