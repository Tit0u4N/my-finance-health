import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Autocomplete, type AutocompleteProps } from './Autocomplete';

function ControlledAutocomplete({
  initialValue = '',
  onValueChange,
  items = ['Carrefour Market', 'Netflix'],
  ...rest
}: Partial<AutocompleteProps> & { readonly initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <Autocomplete
      label="Description"
      placeholder="e.g. Carrefour Market"
      emptyLabel="No matching description"
      items={items}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      {...rest}
    />
  );
}

describe('Autocomplete', () => {
  it('is labeled and controlled: typing fires onValueChange and updates the field', async () => {
    const onValueChange = vi.fn();
    render(<ControlledAutocomplete onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Description');
    await userEvent.type(input, 'car');

    expect(onValueChange).toHaveBeenCalledWith('car');
    expect(input).toHaveValue('car');
  });

  it('lists the given suggestions and fills the field on pick, without needing an exact match', async () => {
    const onValueChange = vi.fn();
    render(<ControlledAutocomplete onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Description');
    await userEvent.type(input, 'car');
    const option = await screen.findByRole('option', { name: 'Carrefour Market' });
    await userEvent.click(option);

    expect(onValueChange).toHaveBeenCalledWith('Carrefour Market');
    expect(input).toHaveValue('Carrefour Market');
  });

  it('shows the empty label when there are no suggestions', async () => {
    render(<ControlledAutocomplete items={[]} />);

    const input = screen.getByLabelText('Description');
    await userEvent.type(input, 'zzz');

    expect(await screen.findByText('No matching description')).toBeInTheDocument();
  });

  it('renders the error message and marks the input invalid', () => {
    render(<ControlledAutocomplete error="Description is required" />);

    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
  });
});
