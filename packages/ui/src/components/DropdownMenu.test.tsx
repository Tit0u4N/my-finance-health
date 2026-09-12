import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenu } from './DropdownMenu';

function renderMenu(onEdit: () => void, onDelete: () => void) {
  return render(
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={onEdit}>Edit</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onClick={onDelete} tone="destructive">
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );
}

describe('DropdownMenu', () => {
  it('renders no menu items until opened', () => {
    renderMenu(vi.fn(), vi.fn());

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('shows both items once the trigger is clicked', async () => {
    renderMenu(vi.fn(), vi.fn());

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('fires the item handler and closes the menu on click', async () => {
    const onEdit = vi.fn();
    renderMenu(onEdit, vi.fn());

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('closes without firing on Escape', async () => {
    const onEdit = vi.fn();
    renderMenu(onEdit, vi.fn());

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menuitem', { name: 'Edit' });
    await userEvent.keyboard('{Escape}');

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
