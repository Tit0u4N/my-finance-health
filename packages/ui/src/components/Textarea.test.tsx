import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label with the control', () => {
    render(<Textarea label="Notes" value="" onChange={() => undefined} />);

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('is a controlled multi-line field: typing fires onChange without the component owning the value', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Notes" value="Core holding" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Notes'), 'x');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Notes')).toHaveValue('Core holding');
  });

  it('renders and announces the error text when present', () => {
    render(<Textarea label="Notes" value="" onChange={() => undefined} error="Note is too long" />);

    expect(screen.getByText('Note is too long')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true');
  });
});
