// @repo/platform — level 0.
// Client-generated ids (start-roadmap.md §17) and cryptographic randomness need a real source;
// the core never calls Math.random or crypto directly so tests can seed it deterministically.

export type RandomService = {
  /** A new random identifier, used for every client-generated entity id. */
  uuid(): string;
  /** `length` cryptographically random bytes, used by journal/file encryption key material. */
  bytes(length: number): Uint8Array;
};
