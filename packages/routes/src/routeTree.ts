// @repo/routes — level 3.
// The DOM route tree (routes.md §1). Code-based for now (`createRootRoute`/`createRoute`) rather
// than the file-based generated tree §6 describes — one route doesn't justify that machinery yet;
// moving to file-based generation later only means relocating these definitions, not rewriting
// anything that consumes `routeTree`.

import { queryKeys } from '@repo/app-core/queries/queryKeys';
import { unwrapResult } from '@repo/app-core/queries/unwrapResult';
import type { AppRouterContext } from '@repo/router/createAppRouter';
import { createRootRouteWithContext, createRoute } from '@tanstack/react-router';
import { AppLayout } from './app/AppLayout';
import { OverviewScreen } from './overview/OverviewScreen';

export const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: AppLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewScreen,
  // Prefetches everything Overview needs that doesn't first require the workspace timezone
  // (transactions/recurring rules are month-scoped, which needs `settings.timezone` — fetching
  // those stays in the screen's own query hooks rather than threading platform's clock through
  // the router context just for this loader; a harmless extra round-trip against the mock
  // in-memory gateway, not a correctness issue).
  loader: ({ context: { queryClient, repositories } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.accounts(),
        queryFn: () => unwrapResult(repositories.accounts.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.exchangeRates(),
        queryFn: () => unwrapResult(repositories.exchangeRates.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(),
        queryFn: () => unwrapResult(repositories.categories.list()),
      }),
    ]),
});

export const routeTree = rootRoute.addChildren([indexRoute]);
