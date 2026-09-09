import type { ReactNode } from 'react';
import { Sidebar, type SidebarProps } from './Sidebar';

export type AppShellProps = SidebarProps & {
  readonly children: ReactNode;
};

/** Sidebar + main column — wraps every path once the app-stage `AppLayout` mounts (routes.md §2). */
export function AppShell({ children, ...sidebarProps }: AppShellProps) {
  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-background">
      <Sidebar {...sidebarProps} />
      <div className="flex h-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
