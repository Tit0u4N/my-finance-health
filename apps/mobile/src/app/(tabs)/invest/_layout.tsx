import { Stack } from 'expo-router';

// `_layout` is imposed by Expo Router, which also requires a default export from every route
// file. `headerShown: false` does not inherit from the parent `(tabs)` Tabs — each nested Stack
// must restate it, or the pushed detail screen gains a native header above its own back row.
export default function InvestStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
