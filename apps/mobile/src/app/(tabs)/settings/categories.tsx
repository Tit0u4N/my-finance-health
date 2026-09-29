import { router } from 'expo-router';
import { CategoriesScreen } from '@/screens/settings/CategoriesScreen';

export default function CategoriesRoute() {
  return <CategoriesScreen onBack={() => router.back()} />;
}
