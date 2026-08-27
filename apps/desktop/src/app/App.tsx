import { LandingPage } from '@repo/ui/components/LandingPage';
import { useApp } from '@/app/useApp';

export function App() {
  const landing = useApp();

  return <LandingPage {...landing} />;
}
