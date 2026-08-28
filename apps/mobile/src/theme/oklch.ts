/**
 * oklch() to sRGB hexadecimal conversion.
 *
 * `@repo/design-tokens` states its colours in oklch because that is what the DOM theme sheet consumes.
 * React Native's colour parser (`@react-native/normalize-colors`) understands hex, rgb, hsl and hwb only —
 * it has no oklch branch — so the native theme converts at runtime instead of duplicating the palette.
 * Converting here, rather than pasting hex values into the app, keeps @repo/design-tokens the single source
 * of truth: a token edit propagates without anyone having to remember this file exists.
 */

const OKLCH_PATTERN = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Linear sRGB to gamma-encoded sRGB, as defined by the sRGB transfer function. */
function encodeGamma(channel: number): number {
  if (channel <= 0.0031308) {
    return 12.92 * channel;
  }

  return 1.055 * channel ** (1 / 2.4) - 0.055;
}

function toHexPair(channel: number): string {
  const clamped = Math.min(1, Math.max(0, channel));

  return Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
}

/**
 * Converts an `oklch(L C H)` string — lightness in 0..1, chroma unitless, hue in degrees — into `#rrggbb`.
 * Out-of-gamut results are clipped per channel, which is what browsers do for the same tokens.
 */
export function oklchToHex(color: string): string {
  const match = OKLCH_PATTERN.exec(color);

  if (match === null) {
    throw new Error(`Unsupported colour token: ${color}. Expected the form oklch(L C H).`);
  }

  const [, rawLightness, rawChroma, rawHue] = match;
  const lightness = Number(rawLightness);
  const chroma = Number(rawChroma);
  const hue = Number(rawHue) * DEGREES_TO_RADIANS;

  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  // Oklab to the cone response space, then cubed back to linear LMS.
  const longCubeRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mediumCubeRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const shortCubeRoot = lightness - 0.0894841775 * a - 1.291485548 * b;

  const long = longCubeRoot ** 3;
  const medium = mediumCubeRoot ** 3;
  const short = shortCubeRoot ** 3;

  const red = 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short;
  const green = -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short;
  const blue = -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short;

  return `#${toHexPair(encodeGamma(red))}${toHexPair(encodeGamma(green))}${toHexPair(encodeGamma(blue))}`;
}
