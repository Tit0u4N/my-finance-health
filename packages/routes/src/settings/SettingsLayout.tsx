// @repo/routes — level 3.
// View for the Settings shell (screens.md "Settings") — the sticky nav rail + content pane every
// /settings/* screen mounts under. JSX and @repo/ui composition only. useTranslation is allowed
// here for static copy — everything derived (plurals, interpolation) stays in the ViewModel.

import { useTranslation } from '@repo/app-core/i18n/useTranslation';
import { Avatar } from '@repo/ui/components/Avatar';
import { Content } from '@repo/ui/components/Content';
import { PageHeader } from '@repo/ui/components/PageHeader';
import { cn } from '@repo/ui/lib/cn';
import { Link, Outlet } from '@tanstack/react-router';
import { useSettingsLayout } from './useSettingsLayout';

export function SettingsLayout() {
  const { t } = useTranslation();
  const { items, activeId } = useSettingsLayout();

  return (
    <>
      <PageHeader title={t('settings:layout.title')} subtitle={t('settings:layout.subtitle')} />
      <Content>
        <div className="grid-settings">
          <div className="sticky top-0 flex flex-col gap-0.5 rounded-lg border border-border bg-surface p-2">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left',
                    isActive && 'bg-accent-soft',
                  )}
                >
                  <Avatar icon={item.icon} color={isActive ? 'var(--mfh-accent)' : item.color} soft size={30} />
                  <div className="min-w-0">
                    <div className={cn('text-label-strong', isActive ? 'text-accent' : 'text-foreground')}>
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-caption text-muted normal-case">{item.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Outlet />
          </div>
        </div>
      </Content>
    </>
  );
}
