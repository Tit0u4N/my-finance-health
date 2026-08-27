import { Button } from './Button';

export type LandingFeature = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

export type LandingPageProps = {
  readonly productName: string;
  readonly targetLabel: string;
  readonly tagline: string;
  readonly description: string;
  readonly features: readonly LandingFeature[];
  readonly primaryActionLabel: string;
  readonly onPrimaryAction: () => void;
  readonly footnote: string;
};

export function LandingPage({
  productName,
  targetLabel,
  tagline,
  description,
  features,
  primaryActionLabel,
  onPrimaryAction,
  footnote,
}: LandingPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center gap-xl px-gutter py-section">
      <header className="flex flex-col gap-md">
        <span className="w-fit rounded-full border border-border bg-muted px-md py-xs text-muted-foreground text-xs uppercase tracking-widest">
          {targetLabel}
        </span>
        <h1 className="font-semibold text-display text-foreground leading-tight">{productName}</h1>
        <p className="text-muted-foreground text-xl">{tagline}</p>
      </header>

      <p className="max-w-2xl text-base text-foreground/80">{description}</p>

      <ul className="grid gap-gutter sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.id} className="rounded-lg border border-border bg-muted/40 p-lg">
            <h2 className="font-medium text-foreground text-lg">{feature.title}</h2>
            <p className="mt-sm text-muted-foreground text-sm">{feature.description}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-md">
        <Button onClick={onPrimaryAction}>{primaryActionLabel}</Button>
        <p className="text-muted-foreground text-sm">{footnote}</p>
      </div>
    </main>
  );
}
