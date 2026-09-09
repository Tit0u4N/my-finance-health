// @repo/routes — level 3.
// The app-stage root layout (routes.md §2) — mounted once the bootstrap hook reports `ready` and
// at least one account exists. Wraps every path in the URL map with the sidebar shell.

import { AppShell } from '@repo/ui/components/AppShell';
import { Outlet } from '@tanstack/react-router';
import { useAppLayout } from './useAppLayout';

export function AppLayout() {
  const layout = useAppLayout();
  return (
    <AppShell {...layout}>
      <Outlet />
    </AppShell>
  );
}
