import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('associates the label with the control', () => {
    render(<Input label="Name" value="" onChange={() => undefined} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('is a controlled input: typing fires onChange without the component owning the value', async () => {
    const onChange = vi.fn();
    render(<Input label="Name" value="Everyday" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Name'), 'x');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('Everyday');
  });

  it('renders and announces the error text when present', () => {
    render(<Input label="Name" value="" onChange={() => undefined} error="Name is required" />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });
});
