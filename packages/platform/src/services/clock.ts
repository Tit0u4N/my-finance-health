// @repo/platform — level 0.
// Time as a primitive, so the core can be tested deterministically (@repo/platform's fake
// platform freezes it). Returns plain strings, not domain types: @repo/domain's branded
// IsoDateTime narrows this at the boundary, since level 0 packages never import each other.

export type Clock = {
  /** Current instant, ISO 8601 with an explicit offset (e.g. "2026-08-31T10:15:00.000Z"). */
  now(): string;
  /** The host's IANA timezone (e.g. "Europe/Paris"), used only to seed a new workspace's timezone. */
  systemTimezone(): string;
};
