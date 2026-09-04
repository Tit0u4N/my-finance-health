// @repo/domain — level 0.
// Interface only. `delete` returns `Result<true, DomainError>` rather than a void-typed success
// — `void` inside a generic is a lint error here (noConfusingVoidType), and a literal `true` is
// a clearer "it worked" marker than `null`.

import type { Category, CategoryPatch, CreateCategoryInput } from '../entities/category';
import type { CategoryId } from '../primitives/entityId';
import type { DomainError } from '../primitives/errors';
import type { Result } from '../primitives/result';

export type CategoryRepository = {
  /** Both kinds, income and expense — the category picker filters client-side by `kind`. */
  list(): Promise<Result<readonly Category[], DomainError>>;
  create(input: CreateCategoryInput): Promise<Result<Category, DomainError>>;
  update(id: CategoryId, patch: CategoryPatch): Promise<Result<Category, DomainError>>;
  delete(id: CategoryId): Promise<Result<true, DomainError>>;
};
