// Logic-free — no ViewModel needed (CLAUDE.md's MVVM exception for UI primitives).

import { Button } from '@repo/ui/components/Button';
import { AlertTriangle } from 'lucide-react';

export type BootstrapErrorProps = {
  readonly message: string;
  readonly onRetry: (() => void) | undefined;
};

export function BootstrapError({ message, onRetry }: BootstrapErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-lg text-center">
      <AlertTriangle size={28} className="text-neg" />
      <div className="text-body-sm text-foreground">{message}</div>
      {onRetry && (
        <Button tone="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
