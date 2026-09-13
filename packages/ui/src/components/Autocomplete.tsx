import { Autocomplete as BaseAutocomplete } from '@base-ui-components/react/autocomplete';
import { useId } from 'react';
import { inputControlClassName } from './inputControlClassName';

export type AutocompleteProps = {
  readonly label?: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Already ranked by the caller (fuse.js, in @repo/app-core) — this component never filters or
   * sorts them itself; see `filter={null}` below. */
  readonly items: readonly string[];
  readonly placeholder?: string;
  readonly emptyLabel: string;
  readonly error?: string;
};

/** base-ui `Autocomplete`, not `Combobox`: its input stays free text — a suggestion is optional,
 * never required — which is exactly this field's job (ui-inventory.md §1). `filter={null}`
 * disables base-ui's own matching so `items` renders exactly as given, already ordered upstream.
 * One `onValueChange` covers both typing and picking a suggestion, so picking one only ever
 * changes this field's own value — never anything else in the draft. No `Field` here, the same
 * call `Select` makes (Select.tsx): id/label association is wired by hand rather than relying on
 * `Field.Label`'s automatic association, which targets `Field.Control` rather than this input. */
export function Autocomplete({
  label,
  value,
  onValueChange,
  items,
  placeholder,
  emptyLabel,
  error,
}: AutocompleteProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label text-muted">
          {label}
        </label>
      )}
      <BaseAutocomplete.Root items={items} value={value} onValueChange={onValueChange} filter={null} mode="list">
        <BaseAutocomplete.Input
          id={inputId}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={inputControlClassName({ className: error ? 'border-neg' : undefined })}
        />
        <BaseAutocomplete.Portal>
          <BaseAutocomplete.Positioner sideOffset={6} className="z-60">
            <BaseAutocomplete.Popup className="min-w-(--anchor-width) overflow-hidden rounded-lg border border-border bg-elevated p-1 shadow-md outline-none">
              <BaseAutocomplete.Empty className="px-2.5 py-2 text-body-sm text-subtle">
                {emptyLabel}
              </BaseAutocomplete.Empty>
              <BaseAutocomplete.List>
                {(item: string) => (
                  <BaseAutocomplete.Item
                    key={item}
                    value={item}
                    className="cursor-pointer rounded-sm px-2.5 py-2 text-body-sm text-foreground outline-none data-[highlighted]:bg-chip-bg"
                  >
                    {item}
                  </BaseAutocomplete.Item>
                )}
              </BaseAutocomplete.List>
            </BaseAutocomplete.Popup>
          </BaseAutocomplete.Positioner>
        </BaseAutocomplete.Portal>
      </BaseAutocomplete.Root>
      {error && <span className="text-body-sm text-neg">{error}</span>}
    </div>
  );
}
