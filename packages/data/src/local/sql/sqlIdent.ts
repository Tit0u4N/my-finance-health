// @repo/data — level 1.
// `transaction` and `desc` are SQL keywords, so every identifier this SQL layer emits is
// double-quoted rather than special-casing the two that collide — one rule, no exceptions to
// remember later when a new column happens to match a keyword too.

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
