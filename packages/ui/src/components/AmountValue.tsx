import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const amountVariants = cva('tabular-nums', {
  variants: {
    tone: {
      default: 'text-foreground',
      positive: 'text-pos',
      negative: 'text-neg',
      muted: 'text-muted',
      /** On top of the accent gradient (StatTile's `hero` tile) — `default`'s `text-foreground`
       * would override the tile's inherited `text-white` and read near-black-on-indigo in light
       * mode (invisible in dark mode only by coincidence, since `--mfh-foreground` is near-white
       * there). */
      onAccent: 'text-white',
    },
  },
  defaultVariants: { tone: 'default' },
});

export type AmountValueProps = VariantProps<typeof amountVariants> & {
  /** Already formatted by the money-formatting selector (app-core-inventory.md §6) — never a raw amount here. */
  readonly value: string;
  /** The "hidemode" every money value in the app supports from day one — the privacy blur toggle. */
  readonly hidden?: boolean;
  readonly className?: string;
};

const MASK = '••••';

/**
 * Every money-bearing spot in the app renders through this instead of a raw string, so the
 * amounts-hidden preference (app-core-inventory.md §3) only ever has to be threaded as a prop —
 * @repo/ui never reads the preferences store itself.
 */
export function AmountValue({ value, hidden = false, tone, className }: AmountValueProps) {
  return <span className={cn(amountVariants({ tone }), className)}>{hidden ? MASK : value}</span>;
}
