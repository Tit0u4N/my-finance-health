// @repo/routes — level 3.
// The DOM route tree (routes.md §1). Code-based for now (`createRootRoute`/`createRoute`) rather
// than the file-based generated tree §6 describes — one route doesn't justify that machinery yet;
// moving to file-based generation later only means relocating these definitions, not rewriting
// anything that consumes `routeTree`.

import { queryKeys } from '@repo/app-core/queries/queryKeys';
import { unwrapResult } from '@repo/app-core/queries/unwrapResult';
import { accountIdSchema, investmentIdSchema } from '@repo/domain/primitives/entityId';
import type { AppRouterContext } from '@repo/router/createAppRouter';
import { createRootRouteWithContext, createRoute, redirect } from '@tanstack/react-router';
import { AccountDetailScreen } from './accounts/AccountDetailScreen';
import { AccountsScreen } from './accounts/AccountsScreen';
import { accountDetailSearchSchema, accountTransactionsCriteria } from './accounts/accountSearch';
import { AppLayout } from './app/AppLayout';
import { InvestmentDetailScreen } from './investments/InvestmentDetailScreen';
import { InvestmentsScreen } from './investments/InvestmentsScreen';
import { investmentDetailSearchSchema } from './investments/investmentSearch';
import { OverviewScreen } from './overview/OverviewScreen';
import { RecurringScreen } from './recurring/RecurringScreen';
import { AboutScreen } from './settings/AboutScreen';
import { CategoriesScreen } from './settings/CategoriesScreen';
import { DatabaseScreen } from './settings/DatabaseScreen';
import { PreferencesScreen } from './settings/PreferencesScreen';
import { SettingsLayout } from './settings/SettingsLayout';
import { TransactionsScreen } from './transactions/TransactionsScreen';
import { ledgerCriteria, transactionsSearchSchema } from './transactions/transactionSearch';

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

export const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts',
  component: AccountsScreen,
  // Per-account 30-day history isn't prefetched here — it needs the account ids, which would
  // make this a two-wave loader; it stays in the screen's own useQueries fan-out, same split
  // Overview's loader already documents above.
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
    ]),
});

export const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionsScreen,
  validateSearch: (search) => transactionsSearchSchema.parse(search),
  // Makes the prefetched transactions(criteria) key match what the screen's own useTransactions
  // call will request on first render (routes.md §4's "no waterfall").
  loaderDeps: ({ search }) => search,
  // No account scope here — the selection store is React context, unreachable from a loader
  // (routeTree.ts's own note on accountsRoute below). It defaults to 'all' per session, so this
  // unscoped criteria matches the screen exactly on a fresh entry; a narrowed scope just costs
  // one extra prefetch, never a wrong render.
  loader: ({ context: { queryClient, repositories }, deps }) => {
    const criteria = ledgerCriteria(deps, undefined);
    return Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.transactions(criteria),
        queryFn: () => unwrapResult(repositories.transactions.list(criteria)),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.accounts(),
        queryFn: () => unwrapResult(repositories.accounts.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(),
        queryFn: () => unwrapResult(repositories.categories.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
    ]);
  },
});

export const recurringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recurring',
  component: RecurringScreen,
  // No search params (routes.md §3 gives /recurring none) and no path param, so — unlike
  // accountDetailRoute below — no `.catch(() => undefined)` guard is needed: `list` returns
  // `ok([])` for zero matches rather than failing.
  loader: ({ context: { queryClient, repositories } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.recurringRules({}),
        queryFn: () => unwrapResult(repositories.recurringRules.list({})),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.accounts(),
        queryFn: () => unwrapResult(repositories.accounts.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(),
        queryFn: () => unwrapResult(repositories.categories.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
    ]),
});

export const investmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/investments',
  component: InvestmentsScreen,
  // Not account-scoped (screens.md's Investments row reads only `investments`), so unlike
  // transactionsRoute/recurringRoute there's no criteria to build here. Per-position value
  // history isn't prefetched here either — it needs the investment ids, which would make this a
  // two-wave loader; it stays in the screen's own useQueries fan-out, the same split
  // accountsRoute's loader comment above documents for per-account balance history.
  loader: ({ context: { queryClient, repositories } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.investments(),
        queryFn: () => unwrapResult(repositories.investments.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
    ]),
});

export const investmentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/investments/$investmentId',
  component: InvestmentDetailScreen,
  validateSearch: (search) => investmentDetailSearchSchema.parse(search),
  // Makes the prefetched investmentValueHistory(id, range) key match what the RangePicker
  // requests on first render — routes.md §4's "no waterfall from load-default-range → user picks
  // a range → refetch", the same reasoning accountDetailRoute below already documents.
  loaderDeps: ({ search: { range } }) => ({ range }),
  loader: async ({ context: { queryClient, repositories }, params: { investmentId }, deps: { range } }) => {
    const id = investmentIdSchema.parse(investmentId);
    await Promise.all([
      // A missing id is a real screen state (useInvestmentDetailScreen's `found: false` arm), not
      // a router error — swallow here so navigation completes and each query's own error state
      // drives the guard, exactly as accountDetailRoute does below.
      queryClient
        .ensureQueryData({
          queryKey: queryKeys.investment(id),
          queryFn: () => unwrapResult(repositories.investments.getById(id)),
        })
        .catch(() => undefined),
      queryClient
        .ensureQueryData({
          queryKey: queryKeys.investmentValueHistory(id, range),
          queryFn: () => unwrapResult(repositories.investments.getValueHistory(id, range)),
        })
        .catch(() => undefined),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
    ]);
  },
});

export const accountDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accounts/$accountId',
  component: AccountDetailScreen,
  validateSearch: (search) => accountDetailSearchSchema.parse(search),
  // Makes the prefetched accountBalanceHistory(id, range) key match what the RangePicker
  // requests on first render — routes.md §4's "no waterfall from load-default-range → user
  // picks a range → refetch".
  loaderDeps: ({ search: { range } }) => ({ range }),
  loader: async ({ context: { queryClient, repositories }, params: { accountId }, deps: { range } }) => {
    const id = accountIdSchema.parse(accountId);
    await Promise.all([
      // A missing id is a real screen state (useAccountDetailScreen's `found: false` arm), not a
      // router error — swallow here so navigation completes and each query's own error state
      // drives the guard. getBalanceHistory looks the account up too (getBalanceHistory itself
      // reads the account first, to seed its running-balance walk), so it fails the exact same
      // way for an unknown id and needs the same guard.
      queryClient
        .ensureQueryData({
          queryKey: queryKeys.account(id),
          queryFn: () => unwrapResult(repositories.accounts.getById(id)),
        })
        .catch(() => undefined),
      queryClient
        .ensureQueryData({
          queryKey: queryKeys.accountBalanceHistory(id, range),
          queryFn: () => unwrapResult(repositories.accounts.getBalanceHistory(id, range)),
        })
        .catch(() => undefined),
      queryClient.ensureQueryData({
        queryKey: queryKeys.transactions(accountTransactionsCriteria(id)),
        queryFn: () => unwrapResult(repositories.transactions.list(accountTransactionsCriteria(id))),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(),
        queryFn: () => unwrapResult(repositories.categories.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
    ]);
  },
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsLayout,
});

export const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/settings/preferences' });
  },
});

export const settingsPreferencesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'preferences',
  component: PreferencesScreen,
  loader: ({ context: { queryClient, repositories } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.workspaceSettings(),
        queryFn: () => unwrapResult(repositories.workspaceSettings.get()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.exchangeRates(),
        queryFn: () => unwrapResult(repositories.exchangeRates.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.accounts(),
        queryFn: () => unwrapResult(repositories.accounts.list()),
      }),
    ]),
});

export const settingsCategoriesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'categories',
  component: CategoriesScreen,
  loader: ({ context: { queryClient, repositories } }) =>
    queryClient.ensureQueryData({
      queryKey: queryKeys.categories(),
      queryFn: () => unwrapResult(repositories.categories.list()),
    }),
});

export const settingsDatabaseRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'database',
  component: DatabaseScreen,
  // Unconditionally prefetched even on a platform without file access — cheap against the mock
  // gateway, and the screen's own capabilities.canWriteFile gate decides whether any of it renders.
  loader: ({ context: { queryClient, repositories } }) =>
    Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.accounts(),
        queryFn: () => unwrapResult(repositories.accounts.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(),
        queryFn: () => unwrapResult(repositories.categories.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.transactions({}),
        queryFn: () => unwrapResult(repositories.transactions.list({})),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.recurringRules({}),
        queryFn: () => unwrapResult(repositories.recurringRules.list({})),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.investments(),
        queryFn: () => unwrapResult(repositories.investments.list()),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.exchangeRates(),
        queryFn: () => unwrapResult(repositories.exchangeRates.list()),
      }),
    ]),
});

export const settingsAboutRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: 'about',
  component: AboutScreen,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  transactionsRoute,
  recurringRoute,
  investmentsRoute,
  investmentDetailRoute,
  accountsRoute,
  accountDetailRoute,
  settingsRoute.addChildren([
    settingsIndexRoute,
    settingsPreferencesRoute,
    settingsCategoriesRoute,
    settingsDatabaseRoute,
    settingsAboutRoute,
  ]),
]);
