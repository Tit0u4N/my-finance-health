import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '../lib/cn';

export type AvatarProps = {
  readonly icon: LucideIcon;
  /** User-chosen hex (Account/Category/Investment.color) — dynamic, so not a design token. */
  readonly color: string;
  /** Pixel size — driven per-usage by layout context (a list row vs. a hero tile), not a fixed set of steps. */
  readonly size?: number;
  readonly soft?: boolean;
  readonly className?: string;
};

/** Icon disc — ui-inventory.md §2. Colour and size are per-instance data, so they're inline style, not utilities. */
export function Avatar({ icon: Icon, color, size = 36, soft = false, className }: AvatarProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 3,
    background: soft ? `color-mix(in oklch, ${color} 14%, transparent)` : color,
    color: soft ? color : 'white',
  };
  return (
    <div className={cn('inline-flex shrink-0 items-center justify-center', className)} style={style}>
      <Icon size={Math.round(size * 0.5)} />
    </div>
  );
}
