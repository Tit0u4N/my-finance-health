// @repo/domain — level 0.
// The hex-color shape shared by Account, Category, and Investment accents (domain-model.md).

import { z } from 'zod';

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a 6-digit hex color, e.g. "#3b82f6"');
export type HexColor = z.infer<typeof hexColorSchema>;
