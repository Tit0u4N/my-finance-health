import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage, type LandingPageProps } from './LandingPage';

const buildProps = (overrides: Partial<LandingPageProps> = {}): LandingPageProps => ({
  productName: 'my finance health',
  targetLabel: 'Web',
  tagline: 'Your accounts, under control',
  description: 'One application, three targets, a single shared core.',
  features: [
    { id: 'workspaces', title: 'Workspaces', description: 'Local or online, chosen at creation.' },
    { id: 'encryption', title: 'Encryption', description: 'Database and journal sealed at rest.' },
  ],
  primaryActionLabel: 'Open a workspace',
  onPrimaryAction: () => undefined,
  footnote: 'No account needed.',
  ...overrides,
});

describe('LandingPage', () => {
  it('renders the product name as the page heading', () => {
    render(<LandingPage {...buildProps()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'my finance health' })).toBeInTheDocument();
  });

  it('renders one entry per feature', () => {
    render(<LandingPage {...buildProps()} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 2, name: 'Workspaces' })).toBeInTheDocument();
  });

  it('calls the primary action when its button is pressed', async () => {
    const onPrimaryAction = vi.fn();
    render(<LandingPage {...buildProps({ onPrimaryAction })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open a workspace' }));

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
