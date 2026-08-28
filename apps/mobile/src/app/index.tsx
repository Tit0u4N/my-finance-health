import { useLandingScreen } from '@/screens/landing/useLandingScreen';
import { LandingPage } from '@/ui/LandingPage';

// `index` is imposed by Expo Router, which also requires a default export from every route file.
export default function LandingRoute() {
  const landing = useLandingScreen();

  return <LandingPage {...landing} />;
}
