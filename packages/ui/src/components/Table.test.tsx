import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';
import { Td } from './Td';

describe('Table', () => {
  it('renders plain headers with no sort button when no column is sortable', () => {
    render(
      <Table head={[{ label: 'Name' }, { label: 'Amount', align: 'right' }]}>
        <tr>
          <Td>Row</Td>
          <Td align="right">€1</Td>
        </tr>
      </Table>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
  });

  it('marks the active sort column and fires onSortChange', async () => {
    const onSortChange = vi.fn();
    render(
      <Table
        head={[
          { label: 'Date', sortKey: 'date' },
          { label: 'Amount', sortKey: 'amount', align: 'right' },
        ]}
        sortKey="date"
        sortDirection="desc"
        onSortChange={onSortChange}
      >
        <tr>
          <Td>2026-09-09</Td>
          <Td align="right">€1</Td>
        </tr>
      </Table>,
    );

    expect(screen.getByRole('columnheader', { name: 'Date' })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute('aria-sort', 'none');

    await userEvent.click(screen.getByRole('button', { name: 'Amount' }));

    expect(onSortChange).toHaveBeenCalledWith('amount');
  });

  it('keeps an srOnly column label out of sight but in the accessibility tree', () => {
    render(
      <Table head={[{ label: 'Name' }, { label: 'Actions', srOnly: true }]}>
        <tr>
          <Td>Row</Td>
          <Td>⋮</Td>
        </tr>
      </Table>,
    );

    const header = screen.getByRole('columnheader', { name: 'Actions' });
    expect(header).toBeInTheDocument();
    expect(header.querySelector('.sr-only')).not.toBeNull();
  });
});
