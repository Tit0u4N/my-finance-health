import { describe, expect, it } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useLandingScreen } from '@/screens/landing/useLandingScreen';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { LandingPage } from './LandingPage';

// Mirrors `App.test.tsx` of apps/desktop: the app layer is tested on composition and presentation only.
function LandingRoute() {
  const landing = useLandingScreen();

  return <LandingPage {...landing} />;
}

async function renderLanding(): Promise<void> {
  await render(
    <ThemeProvider>
      <LandingRoute />
    </ThemeProvider>,
  );
}

describe('LandingPage', () => {
  it('composes the landing screen with the mobile target label', async () => {
    await renderLanding();

    expect(screen.getByText('my finance health')).toBeTruthy();
    expect(screen.getByText('MOBILE')).toBeTruthy();
    expect(screen.getByText('Workspaces')).toBeTruthy();
  });

  it('switches the scheme from the primary action', async () => {
    const user = userEvent.setup();

    await renderLanding();
    await user.press(screen.getByText('Switch to dark theme'));

    expect(screen.getByText('Switch to light theme')).toBeTruthy();
  });
});
