// @repo/platform-expo — level 1.
// Base64 over the engine's `atob`/`btoa` (both present in Hermes since RN 0.74 and in Node). The
// SQL driver needs it for the KDF salt it receives and for BLOB values; @repo/data has its own
// copy, but this package may not import it (biome.json: platform-expo may only reach
// @repo/domain and @repo/platform).

// Not in the native tsconfig's libs (no DOM), but present at runtime in both engines.
declare function atob(data: string): string;
declare function btoa(data: string): string;

export function decodeBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
