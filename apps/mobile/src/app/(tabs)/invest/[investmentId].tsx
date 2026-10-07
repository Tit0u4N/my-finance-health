import { router, useLocalSearchParams } from 'expo-router';
import { InvestmentDetailScreen } from '@/screens/invest/InvestmentDetailScreen';

export default function InvestmentDetailRoute() {
  const { investmentId } = useLocalSearchParams<{ readonly investmentId: string }>();
  return <InvestmentDetailScreen investmentId={investmentId} onBack={() => router.back()} />;
}
