// Re-exported from @repo/app-core/selectors/moneyInput — moved there (2026-09-28 mobile Activity
// pass) so apps/mobile can import the same parse without pulling in this DOM-only package. Kept
// as a re-export here rather than updating every @repo/routes importer's path, since the functions
// themselves are unchanged and this file's own path is part of @repo/routes's public shape.
export { parseAmountInput, toMinorUnits } from '@repo/app-core/selectors/moneyInput';
