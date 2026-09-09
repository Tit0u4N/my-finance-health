import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

describe('App', () => {
  it('boots the mock workspace and renders the Overview screen', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    // "Everyday" legitimately repeats (the Accounts panel row + every activity row on that
    // account) — assert presence via findAllByText rather than requiring a single match.
    expect((await screen.findAllByText('Everyday')).length).toBeGreaterThan(0);
    expect(screen.getByText('Reserve')).toBeInTheDocument();
  });
});
