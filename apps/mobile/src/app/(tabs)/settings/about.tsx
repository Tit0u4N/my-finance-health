import { router } from 'expo-router';
import { AboutScreen } from '@/screens/settings/AboutScreen';

export default function AboutRoute() {
  return <AboutScreen onBack={() => router.back()} />;
}
