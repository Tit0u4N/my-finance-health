import { router, useLocalSearchParams } from 'expo-router';
import { AccountDetailScreen } from '@/screens/accounts/AccountDetailScreen';

export default function AccountDetailRoute() {
  const { accountId } = useLocalSearchParams<{ readonly accountId: string }>();
  return <AccountDetailScreen accountId={accountId} onBack={() => router.back()} />;
}
