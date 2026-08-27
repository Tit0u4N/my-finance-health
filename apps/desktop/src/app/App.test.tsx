import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';

afterEach(() => {
  document.documentElement.classList.remove('dark');
});

describe('App', () => {
  it('composes the shared landing page with the desktop target label', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'my finance health' })).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('switches the document to the dark theme from the primary action', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});
