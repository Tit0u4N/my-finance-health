// @repo/routes — level 3.
// The ledger's search box: typing must not write a router history entry or refetch per
// keystroke (routes.md §3's "search param" decision doesn't mean "on every keydown"). A local
// draft, committed after a pause — reconciled against an external change (the back button, or a
// Reset button) in the render phase, not a useEffect, so it snaps back in the same render rather
// than one tick later.

import { useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 250;

export type UseDebouncedSearchParamResult = {
  readonly value: string;
  readonly onChange: (next: string) => void;
};

export function useDebouncedSearchParam(
  committed: string,
  commit: (value: string) => void,
  delayMs: number = DEFAULT_DELAY_MS,
): UseDebouncedSearchParamResult {
  const [draft, setDraft] = useState(committed);
  const [lastCommitted, setLastCommitted] = useState(committed);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (committed !== lastCommitted) {
    setLastCommitted(committed);
    setDraft(committed);
    clearTimeout(timer.current);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    value: draft,
    onChange: (next) => {
      setDraft(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(next), delayMs);
    },
  };
}
