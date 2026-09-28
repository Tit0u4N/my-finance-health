import { router } from 'expo-router';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

export default function OnboardingRoute() {
  return <OnboardingScreen onDone={() => router.back()} />;
}
