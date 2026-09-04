// @repo/data — level 1.
// Straightforward CRUD over the gateway — Category carries no invariant that spans other
// entities beyond `kind` being immutable, already enforced by CategoryPatch's shape.

import type { CategoryPatch, CreateCategoryInput } from '@repo/domain/entities/category';
import { categoryPatchSchema, categorySchema, createCategoryInputSchema } from '@repo/domain/entities/category';
import type { CategoryId } from '@repo/domain/primitives/entityId';
import { isErr } from '@repo/domain/primitives/result';
import type { CategoryRepository } from '@repo/domain/repositories/categoryRepository';
import { parseInput, type RepositoryDeps } from './shared';

export function createCategoryRepository({ gateway, clock, random }: RepositoryDeps): CategoryRepository {
  return {
    list: async () => gateway.readCollection('category', {}),

    create: (input: CreateCategoryInput) => {
      const parsedInput = parseInput(createCategoryInputSchema, input);
      if (isErr(parsedInput)) {
        return Promise.resolve(parsedInput);
      }
      const now = clock.now();
      const record = categorySchema.parse({ ...parsedInput.value, id: random.uuid(), createdAt: now, updatedAt: now });
      return gateway.write('category', record);
    },

    update: async (id: CategoryId, patch: CategoryPatch) => {
      const parsedPatch = parseInput(categoryPatchSchema, patch);
      if (isErr(parsedPatch)) {
        return parsedPatch;
      }
      const current = await gateway.readById('category', id);
      if (isErr(current)) {
        return current;
      }
      const updated = categorySchema.parse({ ...current.value, ...parsedPatch.value, updatedAt: clock.now() });
      return gateway.write('category', updated);
    },

    delete: async (id: CategoryId) => gateway.delete('category', id),
  };
}
