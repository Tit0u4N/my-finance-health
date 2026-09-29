import { router } from 'expo-router';
import { PreferencesScreen } from '@/screens/settings/PreferencesScreen';

export default function PreferencesRoute() {
  return <PreferencesScreen onBack={() => router.back()} />;
}
