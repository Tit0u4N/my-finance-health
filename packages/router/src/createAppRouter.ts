// @repo/router — level 3.
// Router factory and router context typing (routes.md §6). Web and desktop share this factory —
// each app supplies its own concrete route tree, `QueryClient`, and repository set; the injected
// `history` lets desktop move to in-memory history later without touching @repo/routes.

import type { RepositorySet } from '@repo/domain/repositories/repositorySet';
import type { QueryClient } from '@tanstack/react-query';
import { type AnyRoute, createRouter, type RouterHistory } from '@tanstack/react-router';

/**
 * Typed router context (routes.md §6): the `QueryClient` every route loader prefetches through,
 * and the repository set closed over at router-creation time — loaders run outside the React
 * provider tree, so they can't reach `useRepositories()`.
 */
export type AppRouterContext = {
  readonly queryClient: QueryClient;
  readonly repositories: RepositorySet;
};

export type CreateAppRouterOptions<TRouteTree extends AnyRoute> = {
  readonly routeTree: TRouteTree;
  readonly context: AppRouterContext;
  readonly history?: RouterHistory;
};

export function createAppRouter<TRouteTree extends AnyRoute>({
  routeTree,
  context,
  history,
}: CreateAppRouterOptions<TRouteTree>) {
  return createRouter({
    routeTree,
    context,
    ...(history ? { history } : {}),
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}
