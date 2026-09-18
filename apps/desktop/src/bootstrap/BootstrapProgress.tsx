// Logic-free — no ViewModel needed (CLAUDE.md's MVVM exception for UI primitives).

export type BootstrapProgressProps = {
  readonly label: string;
};

export function BootstrapProgress({ label }: BootstrapProgressProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-xl text-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      <div className="text-body-sm text-muted">{label}</div>
    </div>
  );
}
