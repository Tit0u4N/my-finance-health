// @repo/routes — level 3.
// View for Settings → Categories (screens.md) — JSX and @repo/ui composition only.

import { Button } from '@repo/ui/components/Button';
import { ColorSwatchPicker } from '@repo/ui/components/ColorSwatchPicker';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import { Dialog } from '@repo/ui/components/Dialog';
import { Input } from '@repo/ui/components/Input';
import { Panel } from '@repo/ui/components/Panel';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { CategoryRow } from './useCategoriesScreen';
import { useCategoriesScreen } from './useCategoriesScreen';

type CategoryColumnProps = {
  readonly title: string;
  readonly countLabel: string;
  readonly rows: readonly CategoryRow[];
  readonly onAdd: () => void;
  readonly onEdit: (id: CategoryRow['id']) => void;
  readonly onDelete: (id: CategoryRow['id']) => void;
};

function CategoryColumn({ title, countLabel, rows, onAdd, onEdit, onDelete }: CategoryColumnProps) {
  return (
    <Panel
      title={title}
      subtitle={countLabel}
      bodyClassName="p-0"
      right={
        <Button tone="soft" size="sm" icon={Plus} onClick={onAdd}>
          Add
        </Button>
      }
    >
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={`flex items-center gap-3 px-4.5 py-2.75 ${index < rows.length - 1 ? 'border-border border-b' : ''}`}
        >
          <span className="h-3.5 w-3.5 flex-shrink-0 rounded-sm" style={{ background: row.color }} />
          <div className="flex-1 text-foreground text-label-strong">{row.name}</div>
          <div className="flex gap-0.5 text-subtle">
            <button
              type="button"
              title="Edit"
              onClick={() => onEdit(row.id)}
              className="flex h-7 w-7 items-center justify-center rounded-sm hover:bg-chip-bg"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => onDelete(row.id)}
              className="flex h-7 w-7 items-center justify-center rounded-sm hover:bg-chip-bg"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

export function CategoriesScreen() {
  const screen = useCategoriesScreen();
  if (!screen.ready) {
    return <div className="text-body text-muted">Loading…</div>;
  }

  const { expenses, income, expensesCountLabel, incomeCountLabel, onAdd, onEdit, onDelete, dialog, deleteDialog } =
    screen;

  return (
    <>
      <div className="grid-half">
        <CategoryColumn
          title="Expenses"
          countLabel={expensesCountLabel}
          rows={expenses}
          onAdd={() => onAdd('expense')}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <CategoryColumn
          title="Income"
          countLabel={incomeCountLabel}
          rows={income}
          onAdd={() => onAdd('income')}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <Dialog
        open={dialog.isOpen}
        onOpenChange={dialog.onClose}
        title={dialog.mode === 'create' ? 'New category' : 'Edit category'}
        subtitle={dialog.kindLabel}
        actions={
          <>
            <Button tone="secondary" size="sm" onClick={dialog.onClose}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={dialog.onSubmit} disabled={!dialog.canSubmit}>
              {dialog.mode === 'create' ? 'Create category' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. Groceries"
            value={dialog.name}
            onChange={(event) => dialog.onNameChange(event.target.value)}
          />
          <div>
            <span className="text-label text-muted">Colour</span>
            <div className="mt-2">
              <ColorSwatchPicker value={dialog.color} onChange={dialog.onColorChange} ariaLabel="Category colour" />
            </div>
          </div>
          {dialog.errorMessage && <span className="text-body-sm text-neg">{dialog.errorMessage}</span>}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        title={`Delete "${deleteDialog.name}"?`}
        description={deleteDialog.usageWarning ?? 'This category has no transactions yet.'}
        confirmLabel="Delete"
        onConfirm={deleteDialog.onConfirm}
        isPending={deleteDialog.isSubmitting}
      />
    </>
  );
}
