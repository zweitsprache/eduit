'use client';

import {
  File02,
  GraduationHat01,
  Grid01,
  Image01,
  Settings01,
  User01,
} from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { SidebarAccountCard } from '@/components/app/sidebar-account-card';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';
import { EduitLogo } from '@eduit/ui';

type AppShellProps = {
  active: 'documents' | 'brands';
  title: string;
  isAdmin?: boolean;
  userRole?: string;
  children: React.ReactNode;
};

const WORKSPACE_ITEMS = [
  { id: 'dashboard', labelKey: 'navigation.dashboard', Icon: Grid01, href: '/' },
  { id: 'documents', labelKey: 'navigation.documents', Icon: File02, href: '/documents' },
  { id: 'lessons', labelKey: 'navigation.lessons', Icon: GraduationHat01, href: '#' },
  { id: 'media', labelKey: 'navigation.media', Icon: Image01, href: '#' },
  { id: 'settings', labelKey: 'navigation.settings', Icon: Settings01, href: '/account' },
] as const;

export function AppShell({
  active,
  title,
  isAdmin = false,
  userRole = '',
  children,
}: AppShellProps) {
  const { t } = useI18n();
  const visibleWorkspaceItems = userRole.trim() === 'user'
    ? WORKSPACE_ITEMS.filter(({ id }) => (
        id !== 'lessons' && id !== 'media' && id !== 'settings'
      ))
    : WORKSPACE_ITEMS;
  const translatedTitle = active === 'documents'
    ? t('navigation.documents')
    : active === 'brands'
      ? t('navigation.brandProfiles')
      : title;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-secondary text-primary">
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary px-4 lg:px-6">
        <a href="/documents" className="flex items-center">
          <EduitLogo className="h-6 w-auto" />
        </a>
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-center md:left-64">
          <span className="text-sm font-semibold text-secondary">{translatedTitle}</span>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <LanguageSwitcher compact />
          <a
            href="/account"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
          >
            <User01 className="size-5 text-fg-quaternary" />
            {t('common.account')}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-secondary bg-primary p-4 md:flex">
          <p className="px-3 pb-2 text-xs font-semibold text-quaternary">{t('common.workspace')}</p>
          <nav className="flex flex-col gap-1">
            {visibleWorkspaceItems.map(({ id, labelKey, Icon, href }) => (
              <a
                key={id}
                href={href}
                className={cx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition',
                  active === id
                    ? 'bg-brand-primary text-brand-secondary'
                    : 'text-secondary hover:bg-primary_hover',
                )}
              >
                <Icon className={cx(
                  'size-5',
                  active === id ? 'text-fg-brand-primary' : 'text-fg-quaternary',
                )} />
                {t(labelKey)}
              </a>
            ))}
          </nav>

          {isAdmin && (
            <div className="mt-5 border-t border-secondary pt-4">
              <p className="px-3 pb-2 text-xs font-semibold text-quaternary">Admin</p>
              <nav>
                <a
                  href="/brands"
                  className={cx(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition',
                    active === 'brands'
                      ? 'bg-brand-primary text-brand-secondary'
                      : 'text-secondary hover:bg-primary_hover',
                  )}
                >
                  <Settings01 className={cx(
                    'size-5',
                    active === 'brands' ? 'text-fg-brand-primary' : 'text-fg-quaternary',
                  )} />
                  {t('navigation.brandProfiles')}
                </a>
              </nav>
            </div>
          )}

          <SidebarAccountCard />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
