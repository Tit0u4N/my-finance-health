// Shared by the transaction and recurring-rule sheets: both offer the same coloured category grid,
// filtered to the kind the income/expense toggle is on.
//
// The colour is always carried through (docs/spec/cross-app-pitfalls.md #7 — `Category.color` is
// user-assigned data, not decoration), which is what lets the selected chip tint *with* the
// category instead of switching to a fixed accent.

import type { Category, CategoryKind } from '@repo/domain/entities/category';
import type { LucideIcon } from 'lucide-react-native';
import { categoryIcon } from '@/ui/visuals';

export type CategoryChoice = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly icon: LucideIcon;
};

export function categoryChoices(categories: readonly Category[], kind: CategoryKind): readonly CategoryChoice[] {
  return categories
    .filter((category) => category.kind === kind)
    .map((category) => ({
      color: category.color,
      icon: categoryIcon(category.name),
      id: category.id,
      name: category.name,
    }));
}

/** The pick a kind switch falls back to — `''` when the workspace has no category of that kind,
 * which `canSubmit` then reads as "not submittable" rather than guessing a category of the wrong kind. */
export function firstCategoryOfKind(categories: readonly Category[], kind: CategoryKind): string {
  return categories.find((category) => category.kind === kind)?.id ?? '';
}
