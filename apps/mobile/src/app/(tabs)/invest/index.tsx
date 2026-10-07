import { router } from 'expo-router';
import { InvestmentsScreen } from '@/screens/invest/InvestmentsScreen';

export default function InvestRoute() {
  return (
    <InvestmentsScreen
      onOpenInvestment={(id) => router.push({ params: { investmentId: id }, pathname: '/invest/[investmentId]' })}
    />
  );
}
