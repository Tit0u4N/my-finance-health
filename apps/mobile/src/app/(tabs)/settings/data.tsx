import { router } from 'expo-router';
import { DataScreen } from '@/screens/settings/DataScreen';

export default function DataRoute() {
  return <DataScreen onBack={() => router.back()} />;
}
