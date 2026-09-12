import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { categoricalPaletteHex } from '@repo/design-tokens/colors';
import { cn } from '../lib/cn';

/** The 8-swatch default offered by a category/account colour picker — `design-system.md` §3:
 * "assign `categorical-(n mod 8)` to the n-th created record". `@repo/routes` may not import
 * `@repo/design-tokens` directly (biome.json's boundary for packages/routes/**); this re-export
 * is the one legal hop. */
export const CATEGORY_SWATCHES: readonly string[] = categoricalPaletteHex;

export type ColorSwatchPickerProps = {
  readonly value: string;
  readonly onChange: (color: string) => void;
  readonly swatches?: readonly string[];
  readonly ariaLabel?: string;
};

export function ColorSwatchPicker({
  value,
  onChange,
  swatches = CATEGORY_SWATCHES,
  ariaLabel = 'Colour',
}: ColorSwatchPickerProps) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => onChange(next as string)}
      className="flex flex-wrap gap-2.5"
    >
      {swatches.map((swatch) => (
        <Radio.Root
          key={swatch}
          value={swatch}
          aria-label={swatch}
          className={cn(
            'h-8.5 w-8.5 cursor-pointer rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-surface transition-shadow',
            'data-[checked]:ring-current',
          )}
          style={{ background: swatch, color: swatch }}
        />
      ))}
    </RadioGroup>
  );
}
