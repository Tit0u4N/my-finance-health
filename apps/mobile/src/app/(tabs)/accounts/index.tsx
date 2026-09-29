import { router } from 'expo-router';
import { AccountsScreen } from '@/screens/accounts/AccountsScreen';

export default function AccountsRoute() {
  return (
    <AccountsScreen
      onOpenAccount={(id) => router.push({ params: { accountId: id }, pathname: '/accounts/[accountId]' })}
    />
  );
}
